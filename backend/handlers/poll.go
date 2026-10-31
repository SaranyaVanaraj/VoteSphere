
package handlers

import (
    "context"
    "net/http"
    "strings"
    "time"
    "unicode/utf8"

    "votesphere/backend/config"
    "votesphere/backend/models"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/v2/bson"
)

type CreatePollInput struct {
    Question      string   `json:"question"`
    Options       []string `json:"options"`
    AllowMultiple bool     `json:"allowMultiple"`
    ShowResults   bool     `json:"showResults"`
}

func CreatePoll(c *gin.Context) {
    var input CreatePollInput

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll data"})
        return
    }

    input.Question = strings.TrimSpace(input.Question)

    if utf8.RuneCountInString(input.Question) < 10 ||
        utf8.RuneCountInString(input.Question) > 200 {
        c.JSON(400, gin.H{"error": "Question must contain 10–200 characters"})
        return
    }

    if len(input.Options) < 2 || len(input.Options) > 8 {
        c.JSON(400, gin.H{"error": "Provide 2–8 options"})
        return
    }

    options := make([]models.PollOption, 0, len(input.Options))
    seen := make(map[string]bool)

    for i, raw := range input.Options {
        text := strings.TrimSpace(raw)
        key := strings.ToLower(text)

        if text == "" || utf8.RuneCountInString(text) > 100 || seen[key] {
            c.JSON(400, gin.H{"error": "Options must be unique and 1–100 characters"})
            return
        }

        seen[key] = true

        options = append(options, models.PollOption{
            ID: string(rune('A' + i)),
            Text: text,
        })
    }

    poll := models.Poll{
        ID:            bson.NewObjectID(),
        UserID:        c.GetString("userID"),
        Question:      input.Question,
        Options:       options,
        AllowMultiple: input.AllowMultiple,
        ShowResults:   input.ShowResults,
        Status:        "Active",
        CreatedAt:     time.Now().UTC(),
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    _, err := config.DB.Collection("polls").InsertOne(ctx, poll)
    if err != nil {
        c.JSON(500, gin.H{"error": "Unable to create poll"})
        return
    }

    c.JSON(201, gin.H{
        "message": "Poll created successfully",
        "poll": poll,
    })
}


func GetMyPolls(c *gin.Context) {
    ctx, cancel := context.WithTimeout(
        c.Request.Context(),
        10*time.Second,
    )
    defer cancel()

    cursor, err := config.DB.Collection("polls").Find(
        ctx,
        bson.M{"user_id": c.GetString("userID")},
    )
    if err != nil {
        c.JSON(500, gin.H{"error": "Unable to load polls"})
        return
    }
    defer cursor.Close(ctx)

    polls := []models.Poll{}

    if err := cursor.All(ctx, &polls); err != nil {
        c.JSON(500, gin.H{"error": "Unable to decode polls"})
        return
    }

    type PollWithVotes struct {
        models.Poll
        TotalVotes int64 `json:"totalVotes"`
    }

    result := make([]PollWithVotes, 0, len(polls))
    var totalVotes int64

    for _, poll := range polls {
        count, err := config.DB.Collection("votes").
            CountDocuments(ctx, bson.M{
                "poll_id": poll.ID,
            })

        if err != nil {
            c.JSON(500, gin.H{
                "error": "Unable to count votes",
            })
            return
        }

        result = append(result, PollWithVotes{
            Poll:       poll,
            TotalVotes: count,
        })

        totalVotes += count
    }

    c.JSON(200, gin.H{
        "polls":      result,
        "totalVotes": totalVotes,
    })
}


func GetPublicPoll(c *gin.Context) {
    id, err := bson.ObjectIDFromHex(c.Param("id"))
    if err != nil {
        c.JSON(400, gin.H{"error": "Invalid poll ID"})
        return
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    var poll models.Poll

    err = config.DB.Collection("polls").
        FindOne(ctx, bson.M{"_id": id}).Decode(&poll)

    if err != nil {
        c.JSON(404, gin.H{"error": "Poll not found"})
        return
    }

    c.JSON(200, gin.H{"poll": poll})
}
