
package middleware

import (
    "net/http"
    "os"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        header := c.GetHeader("Authorization")
        parts := strings.SplitN(header, " ", 2)

        if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
            c.AbortWithStatusJSON(http.StatusUnauthorized,
                gin.H{"error": "Authentication required"})
            return
        }

        token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
            return []byte(os.Getenv("JWT_SECRET")), nil
        }, jwt.WithValidMethods([]string{"HS256"}),
            jwt.WithIssuer("votesphere"),
            jwt.WithExpirationRequired())

        if err != nil || !token.Valid {
            c.AbortWithStatusJSON(http.StatusUnauthorized,
                gin.H{"error": "Invalid or expired token"})
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            c.AbortWithStatus(http.StatusUnauthorized)
            return
        }

        userID, ok := claims["sub"].(string)
        if !ok || userID == "" {
            c.AbortWithStatus(http.StatusUnauthorized)
            return
        }

        c.Set("userID", userID)
        c.Next()
    }
}
