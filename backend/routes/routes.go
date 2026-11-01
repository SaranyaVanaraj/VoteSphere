
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

	// Public APIs
	// Poll information can be retrieved publicly,
	// but submitting a vote requires authentication.
	r.GET("/api/polls/:id", handlers.GetPublicPoll)

	// Public poll results
	r.GET("/api/polls/:id/results", handlers.GetPollResults)

	// Public WebSocket for real-time results
	r.GET("/api/polls/:id/ws", handlers.PollWebSocket)

	// Owner WebSocket: requires a valid single-use ticket.
	// Keep these commented until the handlers are enabled.
	// r.GET("/api/polls/:id/owner-ws", handlers.OwnerPollWebSocket)

	// Protected APIs
	protected := r.Group("/api")
	protected.Use(middleware.RequireAuth())

	// Get currently logged-in user
	protected.GET("/me", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"userID": c.GetString("userID"),
		})
	})

	// Create a new poll
	protected.POST("/polls", handlers.CreatePoll)

	// Get polls created by the logged-in user
	protected.GET("/my-polls", handlers.GetMyPolls)

	// Get owner-specific poll results
	protected.GET(
		"/my-polls/:id/results",
		handlers.GetOwnerPollResults,
	)

	// Owner WebSocket ticket
	// protected.POST(
	//     "/my-polls/:id/ws-ticket",
	//     handlers.CreateOwnerWSTicket,
	// )

	// Close or reopen a poll
	protected.PATCH(
		"/polls/:id/status",
		handlers.UpdatePollStatus,
	)

	// Voting requires authentication
	protected.POST(
		"/polls/:id/vote",
		handlers.SubmitVote,
	)
}


