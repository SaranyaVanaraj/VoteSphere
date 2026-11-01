package config

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis() error {
	address := os.Getenv("REDIS_ADDR")

	if address == "" {
		address = "127.0.0.1:6379"
	}

	options := &redis.Options{
		Addr:     address,
		Password: os.Getenv("REDIS_PASSWORD"),
	}

	// Enable TLS for cloud Redis (Upstash).
	if strings.EqualFold(os.Getenv("REDIS_TLS"), "true") {
		options.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	RedisClient = redis.NewClient(options)

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("Redis connection failed: %w", err)
	}

	fmt.Println("Redis connected successfully!")
	return nil
}
