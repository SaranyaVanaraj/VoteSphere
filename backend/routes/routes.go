package routes

import (
	"net/http"

	"votesphere/backend/handlers"
	"votesphere/backend/middleware"

	"github.com/gin-gonic/gin"
)

func Register(r *gin.Engine) {

	// Authentication routes (public)
	auth := r.Group("/api/auth")

	auth.POST("/signup", handlers.Signup)
	auth.POST("/login", handlers.Login)

	// Password recovery (public)
	auth.POST(
		"/forgot-password",
		middleware.PasswordResetRateLimit(),
		handlers.ForgotPassword,
	)

	auth.POST(
		"/reset-password",
		middleware.PasswordResetRateLimit(),
		handlers.ResetPassword,
	)

	// Public poll information
	r.GET(
		"/api/polls/:id",
		handlers.GetPublicPoll,
	)

	// Public poll results
	r.GET(
		"/api/polls/:id/results",
		handlers.GetPollResults,
	)

	// Public WebSocket for live poll results
	r.GET(
		"/api/polls/:id/ws",
		handlers.PollWebSocket,
	)

	// Owner WebSocket requires a valid ticket.
	// Keep disabled until the handlers are enabled.
	// r.GET(
	//     "/api/polls/:id/owner-ws",
	//     handlers.OwnerPollWebSocket,
	// )

	// Protected APIs
	protected := r.Group("/api")
	protected.Use(middleware.RequireAuth())

	// Currently logged-in user
	protected.GET("/me", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"userID": c.GetString("userID"),
		})
	})

	// Create a new poll
	protected.POST(
		"/polls",
		handlers.CreatePoll,
	)

	// Get polls created by the logged-in user
	protected.GET(
		"/my-polls",
		handlers.GetMyPolls,
	)

	// Owner-specific poll results
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
