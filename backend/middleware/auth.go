package middleware

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
	"time"

	"votesphere/backend/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// PasswordVersion returns a fingerprint of the stored password hash.
// It changes whenever the account password changes.
func PasswordVersion(passwordHash string) string {
	sum := sha256.Sum256([]byte(passwordHash))
	return hex.EncodeToString(sum[:])
}

// RequireAuth validates the JWT before allowing access
// to protected routes.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		parts := strings.Fields(header)

		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Authentication required. Please log in.",
				},
			)
			return
		}

		secret := os.Getenv("JWT_SECRET")

		if len(secret) < 32 {
			c.AbortWithStatusJSON(
				http.StatusInternalServerError,
				gin.H{
					"error": "Authentication service unavailable",
				},
			)
			return
		}

		token, err := jwt.Parse(
			parts[1],
			func(t *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			},
			jwt.WithValidMethods([]string{"HS256"}),
			jwt.WithIssuer("votesphere"),
			jwt.WithExpirationRequired(),
		)

		if err != nil || token == nil || !token.Valid {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Invalid or expired token. Please log in again.",
				},
			)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{"error": "Invalid authentication token"},
			)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || strings.TrimSpace(userID) == "" {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{"error": "Invalid user identity"},
			)
			return
		}

		objectID, err := bson.ObjectIDFromHex(userID)
		if err != nil {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{"error": "Invalid user identity"},
			)
			return
		}

		var user struct {
			Password string `bson:"password"`
		}

		ctx, cancel := context.WithTimeout(
			c.Request.Context(),
			5*time.Second,
		)
		defer cancel()

		err = config.DB.Collection("users").
			FindOne(ctx, bson.M{"_id": objectID}).
			Decode(&user)

		if err != nil {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Session invalid. Please log in again.",
				},
			)
			return
		}

		tokenVersion, ok := claims["pwdv"].(string)
		currentVersion := PasswordVersion(user.Password)

		if !ok ||
			subtle.ConstantTimeCompare(
				[]byte(tokenVersion),
				[]byte(currentVersion),
			) != 1 {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Session expired. Please log in again.",
				},
			)
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
