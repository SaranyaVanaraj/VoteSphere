
package handlers

import (
    "context"
    "net/http"
    "time"
    "log"
    "votesphere/backend/config"
    "votesphere/backend/models"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/v2/bson"
    "go.mongodb.org/mongo-driver/v2/mongo"
)

type SubmitVoteInput struct {
    OptionIDs []string `json:"optionIds"`
    VoterID   string   `json:"voterId"`
}

func SubmitVote(c *gin.Context) {
    pollID, err := bson.ObjectIDFromHex(c.Param("id"))
    if err != nil {
        c.JSON(400, gin.H{"error": "Invalid poll ID"})
        return
    }

    var input SubmitVoteInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(400, gin.H{"error": "Invalid vote data"})
        return
    }

    if len(input.VoterID) < 16 || len(input.VoterID) > 128 {
        c.JSON(400, gin.H{"error": "Invalid voter ID"})
        return
    }

    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    var poll models.Poll
    err = config.DB.Collection("polls").
        FindOne(ctx, bson.M{"_id": pollID}).Decode(&poll)

    if err != nil {
        c.JSON(404, gin.H{"error": "Poll not found"})
        return
    }

    if poll.Status != "Active" {
        c.JSON(403, gin.H{"error": "This poll is closed"})
        return
    }

    if len(input.OptionIDs) == 0 ||
        (!poll.AllowMultiple && len(input.OptionIDs) != 1) ||
        len(input.OptionIDs) > len(poll.Options) {
        c.JSON(400, gin.H{"error": "Invalid number of selections"})
        return
    }

    valid := make(map[string]bool)
    for _, option := range poll.Options {
        valid[option.ID] = true
    }

    selected := make(map[string]bool)
    for _, id := range input.OptionIDs {
        if !valid[id] || selected[id] {
            c.JSON(400, gin.H{"error": "Invalid or duplicate option"})
            return
        }
        selected[id] = true
    }

    vote := models.Vote{
        ID:        bson.NewObjectID(),
        PollID:    pollID,
        VoterID:   input.VoterID,
        OptionIDs: input.OptionIDs,
        CreatedAt: time.Now().UTC(),
    }

    _, err = config.DB.Collection("votes").InsertOne(ctx, vote)

    if mongo.IsDuplicateKeyError(err) {
        c.JSON(409, gin.H{"error": "You have already voted in this poll"})
        return
    }

    if err != nil {
        c.JSON(500, gin.H{"error": "Unable to submit vote"})
        return
    }
    
err = config.RedisClient.Publish(
    ctx,
    "poll:"+pollID.Hex(),
    "new_vote",
).Err()

if err != nil {
    log.Println("Redis publish failed:", err)
}


    c.JSON(http.StatusCreated, gin.H{
        "message": "Vote submitted successfully",
    })
}
