
package routes

import (
	"net/http"

	"votesphere/backend/handlers"
	"votesphere/backend/middleware"

	"github.com/gin-gonic/gin"
)

func Register(r *gin.Engine) {

	// Authentication routes
	auth := r.Group("/api/auth")
	auth.POST("/signup", handlers.Signup)
	auth.POST("/login", handlers.Login)

	// Public poll information
	r.GET("/api/polls/:id", handlers.GetPublicPoll)

	// Public poll results
	r.GET("/api/polls/:id/results", handlers.GetPollResults)

	// Public WebSocket for live poll results
	r.GET("/api/polls/:id/ws", handlers.PollWebSocket)

	// Owner WebSocket (validated using a temporary ticket)
	r.GET(
		"/api/polls/:id/owner-ws",
		handlers.OwnerPollWebSocket,
	)

	// Protected APIs
	protected := r.Group("/api")
	protected.Use(middleware.RequireAuth())

	// Logged-in user
	protected.GET("/me", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"userID": c.GetString("userID"),
		})
	})

	// Create poll
	protected.POST("/polls", handlers.CreatePoll)

	// Get user's polls
	protected.GET("/my-polls", handlers.GetMyPolls)

	// Owner poll results
	protected.GET(
		"/my-polls/:id/results",
		handlers.GetOwnerPollResults,
	)

	// Owner WebSocket ticket
	protected.POST(
		"/my-polls/:id/ws-ticket",
		handlers.CreateOwnerWSTicket,
	)

	// Close or reopen poll
	protected.PATCH(
		"/polls/:id/status",
		handlers.UpdatePollStatus,
	)

	// Submit vote (login required)
	protected.POST(
		"/polls/:id/vote",
		handlers.SubmitVote,
	)
}
