
package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// RequireAuth validates the JWT before allowing access
// to protected routes.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {

		// Read Authorization header
		header := c.GetHeader("Authorization")
		parts := strings.Fields(header)

		// Require Bearer token
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

		// Read JWT secret
		secret := os.Getenv("JWT_SECRET")

		if secret == "" {
			c.AbortWithStatusJSON(
				http.StatusInternalServerError,
				gin.H{
					"error": "Authentication service unavailable",
				},
			)
			return
		}

		// Validate JWT signature, algorithm, issuer and expiry
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

		// Extract JWT claims
		claims, ok := token.Claims.(jwt.MapClaims)

		if !ok {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Invalid authentication token",
				},
			)
			return
		}

		// Extract authenticated user ID
		userID, ok := claims["sub"].(string)

		if !ok || strings.TrimSpace(userID) == "" {
			c.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "Invalid user identity",
				},
			)
			return
		}

		// Make authenticated user ID available to handlers
		c.Set("userID", userID)

		// Continue to protected route
		c.Next()
	}
}
