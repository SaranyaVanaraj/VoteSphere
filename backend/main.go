
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "time"

    "votesphere/backend/config"
    "votesphere/backend/routes"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/v2/bson"
    "go.mongodb.org/mongo-driver/v2/mongo"
    "go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
    // Load environment variables
    _ = godotenv.Load()

    if len(os.Getenv("JWT_SECRET")) < 32 {
        log.Fatal("JWT_SECRET must be at least 32 characters")
    }

    // Connect to MongoDB
    if err := config.ConnectDB(); err != nil {
        log.Fatal(err)
    }

    // Connect to Redis
    if err := config.ConnectRedis(); err != nil {
        log.Fatal(err)
    }
    defer config.RedisClient.Close()

    ctx, cancel := context.WithTimeout(
        context.Background(),
        10*time.Second,
    )
    defer cancel()

    // Unique email index
    _, err := config.DB.Collection("users").Indexes().CreateOne(
        ctx,
        mongo.IndexModel{
            Keys: bson.D{
                {Key: "email", Value: 1},
            },
            Options: options.Index().SetUnique(true),
        },
    )

    if err != nil {
        log.Fatal("Could not create email index: ", err)
    }

    // Unique voter per poll index
    _, err = config.DB.Collection("votes").Indexes().CreateOne(
        ctx,
        mongo.IndexModel{
            Keys: bson.D{
                {Key: "poll_id", Value: 1},
                {Key: "voter_id", Value: 1},
            },
            Options: options.Index().SetUnique(true),
        },
    )

    if err != nil {
        log.Fatal("Could not create vote index: ", err)
    }

    // Initialize Gin
    r := gin.Default()

    // CORS middleware
    r.Use(func(c *gin.Context) {
        c.Header(
            "Access-Control-Allow-Origin",
            "http://localhost:5173",
        )
        c.Header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization",
        )
        c.Header(
            "Access-Control-Allow-Methods",
            "GET, POST, PATCH, OPTIONS",
        )

        if c.Request.Method == http.MethodOptions {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    })

    // Health endpoint
    r.GET("/api/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status": "success",
        })
    })

    // Register all API routes
    routes.Register(r)

    // Start backend
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    r.Run("0.0.0.0:" + port)
    log.Fatal(r.Run(":" + port))
}
