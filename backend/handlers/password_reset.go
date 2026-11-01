package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"os"
	"strings"
	"time"

	"votesphere/backend/config"
	"votesphere/backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

type ForgotPasswordInput struct {
	Email string `json:"email" binding:"required"`
}

type ResetPasswordInput struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type PasswordReset struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	UserID    bson.ObjectID `bson:"user_id"`
	TokenHash string        `bson:"token_hash"`
	ExpiresAt time.Time     `bson:"expires_at"`
	CreatedAt time.Time     `bson:"created_at"`
}

const resetMessage = "If this email is registered, a password reset link will be sent."

func generateResetToken() (string, string, error) {
	randomBytes := make([]byte, 32)

	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", err
	}

	token := hex.EncodeToString(randomBytes)
	hash := sha256.Sum256(randomBytes)

	return token, hex.EncodeToString(hash[:]), nil
}

func resetEmailKey(email string) string {
	mac := hmac.New(
		sha256.New,
		[]byte(os.Getenv("JWT_SECRET")),
	)

	mac.Write([]byte(email))

	return "votesphere:reset-email:" +
		hex.EncodeToString(mac.Sum(nil))
}

// Send password-reset email using Resend HTTPS API.
// No SMTP connection is required.
func sendResetEmail(email, resetLink string) error {
	apiKey := strings.TrimSpace(os.Getenv("RESEND_API_KEY"))
	from := strings.TrimSpace(os.Getenv("RESEND_FROM_EMAIL"))

	if apiKey == "" || from == "" {
		return errors.New("Resend configuration is incomplete")
	}

	if _, err := mail.ParseAddress(from); err != nil {
		return errors.New("invalid Resend sender address")
	}

	body := "Hello,\n\n" +
		"We received a request to reset your VoteSphere password.\n\n" +
		"Click the link below to reset your password:\n" +
		resetLink + "\n\n" +
		"This link expires in 15 minutes and can be used only once.\n\n" +
		"If you did not request this, please ignore this email.\n\n" +
		"VoteSphere Team"

	payload := struct {
		From    string   `json:"from"`
		To      []string `json:"to"`
		Subject string   `json:"subject"`
		Text    string   `json:"text"`
	}{
		From:    from,
		To:      []string{email},
		Subject: "VoteSphere Password Reset",
		Text:    body,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		15*time.Second,
	)
	defer cancel()

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://api.resend.com/emails",
		bytes.NewReader(data),
	)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Resend request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		details, _ := io.ReadAll(
			io.LimitReader(resp.Body, 2048),
		)

		return fmt.Errorf(
			"Resend returned HTTP %d: %s",
			resp.StatusCode,
			string(details),
		)
	}

	return nil
}

func ForgotPassword(c *gin.Context) {
	var input ForgotPasswordInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Please enter your email address",
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))

	if !validEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid email address",
		})
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		30*time.Second,
	)
	defer cancel()

	// Apply a 60-second Redis cooldown per email.
	// This also applies to unregistered addresses.
	allowed, err := config.RedisClient.SetNX(
		ctx,
		resetEmailKey(email),
		"1",
		60*time.Second,
	).Result()

	if err != nil {
		log.Println("Password reset Redis error:", err)

		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Please try again later",
		})
		return
	}

	if !allowed {
		c.JSON(http.StatusOK, gin.H{
			"message": resetMessage,
		})
		return
	}

	var user models.User

	err = config.DB.Collection("users").
		FindOne(ctx, bson.M{"email": email}).
		Decode(&user)

	if errors.Is(err, mongo.ErrNoDocuments) {
		c.JSON(http.StatusOK, gin.H{
			"message": resetMessage,
		})
		return
	}

	if err != nil {
		log.Println("Password reset user lookup failed:", err)

		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Please try again later",
		})
		return
	}

	token, tokenHash, err := generateResetToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Unable to process request",
		})
		return
	}

	frontendURL := strings.TrimRight(
		os.Getenv("FRONTEND_URL"),
		"/",
	)

	parsedURL, err := url.Parse(frontendURL)

	if err != nil ||
		parsedURL.Host == "" ||
		parsedURL.User != nil ||
		parsedURL.RawQuery != "" ||
		parsedURL.Fragment != "" ||
		parsedURL.Path != "" ||
		(parsedURL.Scheme != "https" &&
			!(parsedURL.Scheme == "http" &&
				parsedURL.Hostname() == "localhost")) {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Password reset URL is not configured",
		})
		return
	}

	resetLink := frontendURL +
		"/reset-password?token=" +
		url.QueryEscape(token)

	now := time.Now().UTC()

	record := PasswordReset{
		ID:        bson.NewObjectID(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: now.Add(15 * time.Minute),
		CreatedAt: now,
	}

	collection := config.DB.Collection("password_resets")

	// Keep one reset record per user.
	// Do not overwrite the existing immutable _id.
	_, err = collection.UpdateOne(
		ctx,
		bson.M{
			"user_id": user.ID,
		},
		bson.M{
			"$set": bson.M{
				"token_hash": record.TokenHash,
				"expires_at": record.ExpiresAt,
				"created_at": record.CreatedAt,
			},
			"$setOnInsert": bson.M{
				"user_id": user.ID,
			},
		},
		options.UpdateOne().SetUpsert(true),
	)

	if err != nil {
		log.Println("Password reset record error:", err)

		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Please try again later",
		})
		return
	}

	// Attempt delivery through Resend.
	if err := sendResetEmail(email, resetLink); err != nil {
		log.Println("Password reset email failed:", err)

		// Remove only the token that failed to send.
		cleanupCtx, cleanupCancel := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cleanupCancel()

		if _, cleanupErr := collection.DeleteOne(
			cleanupCtx,
			bson.M{
				"user_id":    user.ID,
				"token_hash": tokenHash,
			},
		); cleanupErr != nil {
			log.Println("Reset token cleanup failed:", cleanupErr)
		}
	}

	// Do not disclose whether an email is registered.
	c.JSON(http.StatusOK, gin.H{
		"message": resetMessage,
	})
}

func ResetPassword(c *gin.Context) {
	var input ResetPasswordInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid password reset request",
		})
		return
	}

	if len(input.Token) != 64 ||
		len([]byte(input.Password)) < 8 ||
		len([]byte(input.Password)) > 72 {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid token or password (8-72 bytes)",
		})
		return
	}

	tokenBytes, err := hex.DecodeString(input.Token)

	if err != nil || len(tokenBytes) != 32 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid reset token",
		})
		return
	}

	hash := sha256.Sum256(tokenBytes)
	tokenHash := hex.EncodeToString(hash[:])

	// Hash the new password before consuming the token.
	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(input.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Unable to process password",
		})
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	session, err := config.DB.Client().StartSession()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Unable to process request",
		})
		return
	}
	defer session.EndSession(ctx)

	// Consume the token and update the password
	// within the same MongoDB transaction.
	_, err = session.WithTransaction(
		ctx,
		func(txCtx context.Context) (interface{}, error) {
			var record PasswordReset

			err := config.DB.Collection("password_resets").
				FindOneAndDelete(
					txCtx,
					bson.M{
						"token_hash": tokenHash,
						"expires_at": bson.M{
							"$gt": time.Now().UTC(),
						},
					},
				).Decode(&record)

			if err != nil {
				return nil, err
			}

			result, err := config.DB.Collection("users").
				UpdateOne(
					txCtx,
					bson.M{
						"_id": record.UserID,
					},
					bson.M{
						"$set": bson.M{
							"password": string(passwordHash),
						},
					},
				)

			if err != nil {
				return nil, err
			}

			if result.MatchedCount == 0 {
				return nil, errors.New("user not found")
			}

			// Invalidate any other outstanding reset links.
			_, err = config.DB.Collection("password_resets").
				DeleteMany(
					txCtx,
					bson.M{
						"user_id": record.UserID,
					},
				)

			if err != nil {
				return nil, err
			}

			return nil, nil
		},
	)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Reset link is invalid, expired, or already used",
			})
			return
		}

		log.Println("Password reset transaction failed:", err)

		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Unable to reset password. Please try again.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully. Please log in.",
	})
}
