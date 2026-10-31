
package routes

import (
    "net/http"

    "votesphere/backend/handlers"
    "votesphere/backend/middleware"

    "github.com/gin-gonic/gin"
)

func Register(r *gin.Engine) {
    auth := r.Group("/api/auth")
    auth.POST("/signup", handlers.Signup)
    auth.POST("/login", handlers.Login)

    // Public APIs
    r.GET("/api/polls/:id", handlers.GetPublicPoll)
    r.POST("/api/polls/:id/vote", handlers.SubmitVote)
    r.GET("/api/polls/:id/results", handlers.GetPollResults)
    r.GET("/api/polls/:id/ws", handlers.PollWebSocket)

    // Owner WebSocket: requires a valid single-use ticket
    r.GET("/api/polls/:id/owner-ws", handlers.OwnerPollWebSocket)

    // Protected APIs
    protected := r.Group("/api")
    protected.Use(middleware.RequireAuth())

    protected.GET("/me", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "userID": c.GetString("userID"),
        })
    })

    protected.POST("/polls", handlers.CreatePoll)
    protected.GET("/my-polls", handlers.GetMyPolls)
    protected.GET("/my-polls/:id/results", handlers.GetOwnerPollResults)
    protected.POST("/my-polls/:id/ws-ticket", handlers.CreateOwnerWSTicket)
    protected.PATCH("/polls/:id/status", handlers.UpdatePollStatus)
}

