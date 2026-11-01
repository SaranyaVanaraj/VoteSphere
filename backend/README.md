# VoteSphere Backend

The backend of **VoteSphere**, a real-time polling application, is developed using **Go (Golang) and the Gin framework**.

It manages user authentication, poll creation, voting, poll results, and real-time updates.

## Technology Stack

- **Go (Golang)** — Backend programming language
- **Gin** — REST API framework
- **MongoDB Atlas** — Database for users, polls, and votes
- **Redis** — Real-time communication infrastructure
- **WebSockets** — Live polling updates
- **JWT** — User authentication
- **bcrypt** — Secure password hashing

## Key Features

- User registration and login
- JWT-protected API endpoints
- Poll creation and management
- Vote submission and validation
- Real-time poll result updates
- MongoDB database integration
- Redis integration

## Local Setup

1. Navigate to the backend directory.

2. Install Go dependencies:

```bash
go mod download
```

3. Configure the required MongoDB, Redis, and JWT environment variables in a local `.env` file.

4. Start the backend server:

```bash
go run main.go
```

## Deployment

The backend is deployed on Render.

**Live Application:** https://vote-sphere-poll.vercel.app/

**GitHub Repository:** https://github.com/SaranyaVanaraj/VoteSphere

## Security

The backend uses bcrypt password hashing, JWT authentication, protected API routes, and environment variables for sensitive configuration.