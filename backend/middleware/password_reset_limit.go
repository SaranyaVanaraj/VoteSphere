package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"votesphere/backend/config"

	"github.com/gin-gonic/gin"
)

func rateLimitKey(kind, value string) string {
	mac := hmac.New(
		sha256.New,
		[]byte(os.Getenv("JWT_SECRET")),
	)
	mac.Write([]byte(value))

	return "votesphere:ratelimit:" + kind + ":" +
		hex.EncodeToString(mac.Sum(nil))
}

// PasswordResetRateLimit protects both password recovery
// endpoints from repeated requests.
func PasswordResetRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(
			c.Request.Context(),
			3*time.Second,
		)
		defer cancel()

		key := rateLimitKey(
			"reset-ip:"+c.FullPath(),
			strings.TrimSpace(c.ClientIP()),
		)

		// Fixed window: maximum 10 requests per 15 minutes
		// per IP address, per endpoint.
		count, err := config.RedisClient.Incr(ctx, key).Result()
		if err != nil {
			log.Println("Password reset rate limiter:", err)
			c.AbortWithStatusJSON(
				http.StatusServiceUnavailable,
				gin.H{"error": "Please try again later."},
			)
			return
		}

		if count == 1 {
			_, err = config.RedisClient.Expire(
				ctx,
				key,
				15*time.Minute,
			).Result()

			if err != nil {
				log.Println("Rate limiter expiry:", err)
				c.AbortWithStatusJSON(
					http.StatusServiceUnavailable,
					gin.H{"error": "Please try again later."},
				)
				return
			}
		}

		if count > 10 {
			c.AbortWithStatusJSON(
				http.StatusTooManyRequests,
				gin.H{
					"error": "Too many requests. Please try again later.",
				},
			)
			return
		}

		c.Next()
	}
}
