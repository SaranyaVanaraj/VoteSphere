
package handlers

import (
    "context"
    "net/http"
    "time"

    "votesphere/backend/config"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/v2/bson"
    "go.mongodb.org/mongo-driver/v2/mongo"
)

type UpdatePollStatusInput struct {
    Status string `json:"status"`
}

func UpdatePollStatus(c *gin.Context) {
    pollID, err := bson.ObjectIDFromHex(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid poll ID",
        })
        return
    }

    var input UpdatePollStatusInput

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request body",
        })
        return
    }

    if input.Status != "Active" && input.Status != "Closed" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Status must be Active or Closed",
        })
        return
    }

    userID := c.GetString("userID")

    if userID == "" {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Authentication required",
        })
        return
    }

    ctx, cancel := context.WithTimeout(
        c.Request.Context(),
        10*time.Second,
    )
    defer cancel()

    filter := bson.M{
        "_id":     pollID,
        "user_id": userID,
    }

    update := bson.M{
        "$set": bson.M{
            "status": input.Status,
        },
    }

    result, err := config.DB.Collection("polls").
        UpdateOne(ctx, filter, update)

    if err != nil {
        if err == mongo.ErrNoDocuments {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "Poll not found",
            })
            return
        }

        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Unable to update poll status",
        })
        return
    }

    if result.MatchedCount == 0 {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Poll not found or you do not own this poll",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Poll status updated successfully",
        "status":  input.Status,
    })
}
