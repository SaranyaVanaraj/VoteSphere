
package handlers

import (
    "context"
    "net/http"
    "time"

    "votesphere/backend/config"
    "votesphere/backend/models"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/v2/bson"
)

func GetOwnerPollResults(c *gin.Context) {
    pollID, err := bson.ObjectIDFromHex(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid poll ID",
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

    var poll models.Poll

    err = config.DB.Collection("polls").FindOne(
        ctx,
        bson.M{
            "_id":     pollID,
            "user_id": userID,
        },
    ).Decode(&poll)

    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Poll not found or access denied",
        })
        return
    }

    cursor, err := config.DB.Collection("votes").Find(
        ctx,
        bson.M{"poll_id": pollID},
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Could not load votes",
        })
        return
    }
    defer cursor.Close(ctx)

    counts := make(map[string]int)
    totalVoters := 0

    for cursor.Next(ctx) {
        var vote models.Vote

        if err := cursor.Decode(&vote); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "Could not read vote",
            })
            return
        }

        totalVoters++

        for _, optionID := range vote.OptionIDs {
            counts[optionID]++
        }
    }

    if err := cursor.Err(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Could not read votes",
        })
        return
    }

    results := make([]OptionResult, 0, len(poll.Options))

    for _, option := range poll.Options {
        count := counts[option.ID]
        percentage := 0.0

        if totalVoters > 0 {
            percentage = float64(count) /
                float64(totalVoters) * 100
        }

        results = append(results, OptionResult{
            ID:         option.ID,
            Text:       option.Text,
            Votes:      count,
            Percentage: percentage,
        })
    }

    c.JSON(http.StatusOK, gin.H{
        "pollId":        poll.ID.Hex(),
        "question":      poll.Question,
        "totalVoters":   totalVoters,
        "allowMultiple": poll.AllowMultiple,
        "options":       results,
    })
}
