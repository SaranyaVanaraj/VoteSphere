
package handlers

import (
    "context"
    "net/http"
    "net/mail"
    "os"
    "strings"
    "time"

    "votesphere/backend/config"
    "votesphere/backend/models"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
    "go.mongodb.org/mongo-driver/v2/bson"
    "go.mongodb.org/mongo-driver/v2/mongo"
)

type SignupInput struct {
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required"`
    Password string `json:"password" binding:"required"`
}

type LoginInput struct {
    Email    string `json:"email" binding:"required"`
    Password string `json:"password" binding:"required"`
}

func validEmail(email string) bool {
    address, err := mail.ParseAddress(email)
    return err == nil && address.Address == email &&
        !strings.ContainsAny(email, " \t\n")
}

func Signup(c *gin.Context) {
    var input SignupInput

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signup details"})
        return
    }

    input.Name = strings.TrimSpace(input.Name)
    input.Email = strings.ToLower(strings.TrimSpace(input.Email))

    if len(input.Name) < 2 || len(input.Name) > 100 ||
        !validEmail(input.Email) ||
        len(input.Password) < 8 || len(input.Password) > 72 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid name, email or password (8–72 bytes)"})
        return
    }

    hash, err := bcrypt.GenerateFromPassword(
        []byte(input.Password), bcrypt.DefaultCost,
    )
    if err != nil {
        c.JSON(500, gin.H{"error": "Could not process password"})
        return
    }

    user := models.User{
        ID:       bson.NewObjectID(),
        Name:     input.Name,
        Email:    input.Email,
        Password: string(hash),
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    _, err = config.DB.Collection("users").InsertOne(ctx, user)
    if err != nil {
        if mongo.IsDuplicateKeyError(err) {
            c.JSON(409, gin.H{"error": "Email already registered"})
            return
        }
        c.JSON(500, gin.H{"error": "Could not create account"})
        return
    }

    c.JSON(201, gin.H{"message": "Account created successfully"})
}

func Login(c *gin.Context) {
    var input LoginInput

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(400, gin.H{"error": "Invalid login details"})
        return
    }

    email := strings.ToLower(strings.TrimSpace(input.Email))
    if !validEmail(email) || input.Password == "" {
        c.JSON(400, gin.H{"error": "Invalid login details"})
        return
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    var user models.User
    err := config.DB.Collection("users").
        FindOne(ctx, bson.M{"email": email}).Decode(&user)

    if err != nil || bcrypt.CompareHashAndPassword(
        []byte(user.Password), []byte(input.Password),
    ) != nil {
        c.JSON(401, gin.H{"error": "Invalid email or password"})
        return
    }

    secret := os.Getenv("JWT_SECRET")
    if len(secret) < 32 {
        c.JSON(500, gin.H{"error": "Authentication configuration error"})
        return
    }

    claims := jwt.MapClaims{
        "sub": user.ID.Hex(),
        "exp": time.Now().Add(24 * time.Hour).Unix(),
        "iat": time.Now().Unix(),
        "iss": "votesphere",
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signedToken, err := token.SignedString([]byte(secret))
    if err != nil {
        c.JSON(500, gin.H{"error": "Could not create session"})
        return
    }

    c.JSON(200, gin.H{
        "message": "Login successful",
        "token": signedToken,
        "user": gin.H{
            "id": user.ID.Hex(),
            "name": user.Name,
            "email": user.Email,
        },
    })
}
