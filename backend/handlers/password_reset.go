package handlers

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"errors"
	"log"
	"net"
	"net/http"
	"net/mail"
	"net/smtp"
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

func sendResetEmail(email, resetLink string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")
	from := os.Getenv("SMTP_FROM")

	if host != "smtp.gmail.com" ||
		port != "587" ||
		username == "" ||
		password == "" ||
		from == "" {
		return errors.New("Gmail SMTP configuration is incomplete")
	}

	fromAddress, err := mail.ParseAddress(from)
	if err != nil || fromAddress.Address != from {
		return errors.New("invalid SMTP sender address")
	}

	toAddress, err := mail.ParseAddress(email)
	if err != nil || toAddress.Address != email {
		return errors.New("invalid recipient email address")
	}

	body := "Hello,\r\n\r\n" +
		"We received a request to reset your VoteSphere password.\r\n\r\n" +
		"Open the link below:\r\n" +
		resetLink + "\r\n\r\n" +
		"This link expires in 15 minutes and can be used only once.\r\n\r\n" +
		"If you did not request this, please ignore this email.\r\n"

	message := []byte(
		"From: " + from + "\r\n" +
			"To: " + email + "\r\n" +
			"Subject: VoteSphere Password Reset\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
			body,
	)

	address := net.JoinHostPort(host, port)

	// Use a bounded SMTP connection and STARTTLS.
	conn, err := net.DialTimeout(
		"tcp",
		address,
		10*time.Second,
	)
	if err != nil {
		return err
	}

	_ = conn.SetDeadline(time.Now().Add(20 * time.Second))

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		conn.Close()
		return err
	}
	defer client.Close()

	ok, _ := client.Extension("STARTTLS")
	if !ok {
		return errors.New("SMTP server does not support STARTTLS")
	}

	tlsConfig := &tls.Config{
		ServerName: host,
		MinVersion: tls.VersionTLS12,
	}

	if err := client.StartTLS(tlsConfig); err != nil {
		return err
	}

	auth := smtp.PlainAuth("", username, password, host)

	if err := client.Auth(auth); err != nil {
		return err
	}

	if err := client.Mail(from); err != nil {
		return err
	}

	if err := client.Rcpt(email); err != nil {
		return err
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}

	if _, err := writer.Write(message); err != nil {
		writer.Close()
		return err
	}

	if err := writer.Close(); err != nil {
		return err
	}

	return client.Quit()
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

	// Redis cooldown applies even if the email is not registered.
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

	// Update an existing record without modifying its _id.
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

	if err := sendResetEmail(email, resetLink); err != nil {
		log.Println("Password reset email failed:", err)

		cleanupCtx, cleanupCancel := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cleanupCancel()

		_, _ = collection.DeleteOne(
			cleanupCtx,
			bson.M{
				"user_id":    user.ID,
				"token_hash": tokenHash,
			},
		)
	}

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

	// Hash the password before starting the transaction.
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
		log.Println("Password reset transaction failed:", err)

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Reset link is invalid, expired, or already used",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully. Please log in.",
	})
}
