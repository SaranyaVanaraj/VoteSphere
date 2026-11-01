# VoteSphere 🗳️
### A Real-Time Live Polling Application

VoteSphere is a full-stack, real-time polling web application that allows users to create polls, participate in voting, and view live results. Built with React.js, Go (Gin), MongoDB, and Redis, the application provides an interactive and responsive polling experience.

🌐 **Live Website:** https://vote-sphere-poll.vercel.app/

💻 **GitHub Repository:** https://github.com/SaranyaVanaraj/VoteSphere.git

---

## Features

- **User Authentication:** Secure user registration and login.
- **Poll Creation:** Authenticated users can create polls with multiple voting options.
- **Live Voting:** Users can participate in polls and submit their votes.
- **Real-Time Results:** Poll results update dynamically using real-time communication.
- **Poll Management:** Poll creators can manage their polls and view results.
- **Dark and Light Mode:** Theme switching for a personalized user experience.
- **Responsive Design:** Optimized for desktop, tablet, and mobile screens.
- **Secure Backend:** Protected API endpoints and password hashing.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, JavaScript, CSS |
| Backend | Go (Golang), Gin Framework |
| Database | MongoDB Atlas |
| Real-Time Communication | Redis, WebSockets |
| Authentication | JWT, bcrypt |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git and GitHub |

## System Architecture

```text
                  USER
                    |
                    v
           React.js Frontend
             (Vercel)
                    |
                    | REST API / WebSocket
                    v
             Go + Gin Backend
                (Render)
                    |
           +--------+--------+
           |                 |
           v                 v
      MongoDB Atlas        Redis
      User & Poll Data   Real-Time Events
```

## Project Structure

```text
VoteSphere/
|
|-- backend/
|   |-- config/
|   |-- handlers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- main.go
|   |-- go.mod
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |-- package.json
|
|-- README.md
```

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js and npm
- Go (Golang)
- Git
- MongoDB Atlas account or a MongoDB instance
- Redis instance

### 1. Clone the Repository

```bash
git clone https://github.com/SaranyaVanaraj/VoteSphere.git
cd VoteSphere
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install Go dependencies:

```bash
go mod download
```

Create a `.env` file in the backend folder and configure the MongoDB connection, Redis connection, JWT secret, and server settings using the environment variable names expected by the backend configuration.

Start the backend:

```bash
go run main.go
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend folder:

```env
VITE_API_URL=http://localhost:8080
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically `http://localhost:5173`.

## How VoteSphere Works

1. **Register or Login:** Users create an account or log in using their credentials.
2. **Create a Poll:** An authenticated user creates a poll with a question and voting options.
3. **Share and Participate:** Users access the poll and submit their votes.
4. **View Results:** The application displays voting results and updates them in real time.
5. **Manage Polls:** Poll creators can view their created polls and manage their status.

## Security

VoteSphere incorporates several security measures:

- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- MongoDB-backed user accounts
- Environment variables for sensitive configuration
- Backend validation of incoming requests

Sensitive information such as database credentials, API secrets, and `.env` files should never be committed to the repository.

## Deployment

The application is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas
- **Real-Time Infrastructure:** Redis

**Live Application:** https://vote-sphere-poll.vercel.app/

## Future Enhancements

- Poll scheduling and automatic expiration
- Advanced voting analytics and visualizations
- Exporting poll results
- Additional poll customization options
- Improved accessibility and multilingual support





