
package handlers

import (
    "context"
    "crypto/rand"
    "encoding/hex"
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

const ownerWSTicketTTL = 30 * time.Second

func CreateOwnerWSTicket(c *gin.Context) {
    pollID := c.Param("id")
    userID := c.GetString("userID")

    objectID, err := bson.ObjectIDFromHex(pollID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid poll ID",
        })
        return
    }

    ctx, cancel := context.WithTimeout(
        c.Request.Context(), 5*time.Second,
    )
    defer cancel()

    var poll models.Poll

    err = config.DB.Collection("polls").FindOne(
        ctx, bson.M{"_id": objectID},
    ).Decode(&poll)

    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Poll not found",
        })
        return
    }

    // Use the same ownership field and ID format
    // as your existing GetOwnerPollResults handler.
    if !isPollOwner(poll, userID) {
        c.JSON(http.StatusForbidden, gin.H{
            "error": "Only the poll creator can view these results",
        })
        return
    }

    randomBytes := make([]byte, 32)
    if _, err := rand.Read(randomBytes); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Could not create connection ticket",
        })
        return
    }

    ticket := hex.EncodeToString(randomBytes)
    ticketKey := "owner-ws-ticket:" + ticket

    err = config.RedisClient.Set(
        ctx, ticketKey, pollID, ownerWSTicketTTL,
    ).Err()

    if err != nil {
        c.JSON(http.StatusServiceUnavailable, gin.H{
            "error": "Realtime service unavailable",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "ticket": ticket,
    })
}

func OwnerPollWebSocket(c *gin.Context) {
    pollID := c.Param("id")
    ticket := c.Query("ticket")

    if _, err := bson.ObjectIDFromHex(pollID); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid poll ID",
        })
        return
    }

    if len(ticket) != 64 {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Invalid connection ticket",
        })
        return
    }

    ctx, cancel := context.WithTimeout(
        c.Request.Context(), 5*time.Second,
    )
    defer cancel()

    // GETDEL atomically consumes the ticket.
    storedPollID, err := config.RedisClient.GetDel(
        ctx, "owner-ws-ticket:"+ticket,
    ).Result()

    if err != nil || storedPollID != pollID {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Expired or invalid connection ticket",
        })
        return
    }

    // Reuse the existing origin-checked upgrader.
    conn, err := upgrader.Upgrade(
        c.Writer, c.Request, nil,
    )
    if err != nil {
        return
    }
    defer conn.Close()

    streamCtx, streamCancel := context.WithCancel(
        c.Request.Context(),
    )
    defer streamCancel()

    subscriber := config.RedisClient.Subscribe(
        streamCtx, "poll:"+pollID,
    )
    defer subscriber.Close()

    if _, err := subscriber.Receive(streamCtx); err != nil {
        log.Println("Owner Redis subscription error:", err)
        return
    }

    disconnected := make(chan struct{})

    go func() {
        defer close(disconnected)

        for {
            if _, _, err := conn.ReadMessage(); err != nil {
                return
            }
        }
    }()

    messages := subscriber.Channel()

    for {
        select {
        case <-disconnected:
            return

        case <-streamCtx.Done():
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
                websocket.TextMessage, payload,
            ); err != nil {
                return
            }
        }
    }
}
func isPollOwner(poll models.Poll, userID string) bool {
    return userID != "" && poll.UserID == userID
}