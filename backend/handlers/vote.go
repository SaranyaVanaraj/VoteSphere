package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"votesphere/backend/config"
	"votesphere/backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// Vote request now contains only selected option IDs.
// Voter identity is obtained from the authenticated JWT.
type SubmitVoteInput struct {
	OptionIDs []string `json:"optionIds"`
}

func SubmitVote(c *gin.Context) {

	// Get authenticated user ID from middleware
	userID := c.GetString("userID")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Please log in to vote",
		})
		return
	}

	// Validate poll ID
	pollID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID",
		})
		return
	}

	// Read vote request
	var input SubmitVoteInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid vote data",
		})
		return
	}

	// Create request context
	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		10*time.Second,
	)
	defer cancel()

	// Find poll in MongoDB
	var poll models.Poll

	err = config.DB.Collection("polls").
		FindOne(ctx, bson.M{
			"_id": pollID,
		}).
		Decode(&poll)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Poll not found",
		})
		return
	}

	// Check whether poll is active
	if poll.Status != "Active" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "This poll is closed",
		})
		return
	}

	// Validate number of selected options
	if len(input.OptionIDs) == 0 ||
		(!poll.AllowMultiple && len(input.OptionIDs) != 1) ||
		len(input.OptionIDs) > len(poll.Options) {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid number of selections",
		})
		return
	}

	// Build valid option map
	valid := make(map[string]bool)

	for _, option := range poll.Options {
		valid[option.ID] = true
	}

	// Validate selected options
	selected := make(map[string]bool)

	for _, optionID := range input.OptionIDs {

		if !valid[optionID] || selected[optionID] {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid or duplicate option",
			})
			return
		}

		selected[optionID] = true
	}

	// Create vote using authenticated account ID
	vote := models.Vote{
		ID:        bson.NewObjectID(),
		PollID:    pollID,
		VoterID:   userID,
		OptionIDs: input.OptionIDs,
		CreatedAt: time.Now().UTC(),
	}

	// Save vote in MongoDB
	_, err = config.DB.Collection("votes").InsertOne(ctx, vote)

	// Prevent duplicate voting
	if mongo.IsDuplicateKeyError(err) {
		c.JSON(http.StatusConflict, gin.H{
			"error": "You have already voted in this poll",
		})
		return
	}

	if err != nil {
		log.Println("Vote insertion failed:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Unable to submit vote",
		})
		return
	}

	// Notify connected clients through Redis
	err = config.RedisClient.Publish(
		ctx,
		"poll:"+pollID.Hex(),
		"new_vote",
	).Err()

	if err != nil {
		log.Println("Redis publish failed:", err)
	}

	// Return success response
	c.JSON(http.StatusCreated, gin.H{
		"message": "Vote submitted successfully",
	})
}
