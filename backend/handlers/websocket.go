
package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"votesphere/backend/config"
	"votesphere/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/v2/bson"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return r.Header.Get("Origin") == "http://localhost:5173"
	},
}

func PollWebSocket(c *gin.Context) {
	pollID := c.Param("id")

	// Step 1: Validate poll ID
	objectID, err := bson.ObjectIDFromHex(pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID",
		})
		return
	}

	// Step 2: Load poll from MongoDB
	lookupCtx, lookupCancel := context.WithTimeout(
		c.Request.Context(),
		10*time.Second,
	)
	defer lookupCancel()

	var poll models.Poll

	err = config.DB.Collection("polls").FindOne(
		lookupCtx,
		bson.M{"_id": objectID},
	).Decode(&poll)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Poll not found",
		})
		return
	}

	// Step 3: Block public access to private results
	if !poll.ShowResults {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Live results are private for this poll",
		})
		return
	}

	// Step 4: Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(
		c.Writer,
		c.Request,
		nil,
	)
	if err != nil {
		return
	}
	defer conn.Close()

	// Step 5: Create Redis subscription
	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	channel := "poll:" + pollID

	subscriber := config.RedisClient.Subscribe(ctx, channel)
	defer subscriber.Close()

	if _, err := subscriber.Receive(ctx); err != nil {
		log.Println("Redis subscription error:", err)
		return
	}

	messages := subscriber.Channel()

	// Step 6: Detect browser disconnection
	disconnected := make(chan struct{})

	go func() {
		defer close(disconnected)

		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()

	// Step 7: Forward Redis notifications
	for {
		select {
		case <-disconnected:
			return

		case <-ctx.Done():
			return

		case msg, ok := <-messages:
			if !ok {
				return
			}

			payload, err := json.Marshal(gin.H{
				"type":   "vote_update",
				"pollId": pollID,
				"time":   time.Now().UTC(),
				"event":  msg.Payload,
			})
			if err != nil {
				continue
			}

			if err := conn.WriteMessage(
				websocket.TextMessage,
				payload,
			); err != nil {
				return
			}
		}
	}
}
