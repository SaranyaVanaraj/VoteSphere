
package config

import (
    "context"
    "fmt"
    "os"
    "time"

    "github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis() error {
    address := os.Getenv("REDIS_ADDR")

    if address == "" {
        address = "localhost:6379"
    }

    RedisClient = redis.NewClient(&redis.Options{
        Addr: address,
    })

    ctx, cancel := context.WithTimeout(
        context.Background(),
        5*time.Second,
    )
    defer cancel()

    if err := RedisClient.Ping(ctx).Err(); err != nil {
        return fmt.Errorf("Redis connection failed: %w", err)
    }

    fmt.Println("Redis connected successfully!")
    return nil
}
