# VoteSphere 🗳️
### Real-Time Polling and Voting Platform

VoteSphere is a full-stack real-time polling application that enables users to create polls, share them with participants, collect votes, and visualize results instantly.

Built with **React.js, Go (Gin), MongoDB, and Redis**, VoteSphere provides a responsive, interactive polling experience with real-time updates powered by WebSockets.

## ✨ Features

- **User Authentication:** Secure user registration and login using JWT authentication.
- **Poll Creation:** Create polls with multiple options and customizable voting settings.
- **Single and Multiple Selection:** Allow participants to select one or multiple answers depending on the poll configuration.
- **Real-Time Voting:** View results automatically without refreshing the page.
- **QR Code Sharing:** Generate, copy, and download QR codes to share polls easily.
- **Live Results Dashboard:** Visualize voting statistics, percentages, and leading options.
- **CSV Export:** Download poll results as CSV files for further analysis.
- **Poll Management:** View, search, filter, close, and reopen created polls.
- **Result Visibility Control:** Choose whether participants can view poll results.
- **Duplicate Vote Prevention:** Prevent repeated submissions from the same voter identifier.
- **Dark and Light Mode:** Switch between themes for a personalized experience.
- **Responsive Interface:** Designed for desktop and mobile devices.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Go (Golang), Gin Framework |
| Database | MongoDB Atlas |
| Real-Time Communication | Redis Pub/Sub, WebSockets |
| Authentication | JWT |
| Icons | Lucide React |
| QR Code Generation | qrcode.react |

## 🏗️ System Architecture

```text
                USER / PARTICIPANT
                        |
                        v
                React.js Frontend
                        |
                        v
                  Go + Gin API
                        |
              +---------+---------+
              |                   |
              v                   v
         MongoDB Atlas        Redis Pub/Sub
              |                   |
              |                   v
              |              WebSocket
              |                   |
              +---------+---------+
                        |
                        v
                Live Results UI
```

**Workflow:**

1. A user registers or logs in.
2. The authenticated user creates a poll.
3. The poll is stored in MongoDB.
4. Participants access the poll through a shared link or QR code.
5. Votes are validated and stored in MongoDB.
6. Redis Pub/Sub distributes voting updates.
7. WebSockets notify connected clients.
8. The React frontend fetches updated results and refreshes the visualization automatically.

## 📁 Project Structure

```text
VoteSphere/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── handlers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── main.go
│   ├── go.mod
│   └── go.sum
│
├── .gitignore
└── README.md
```

## 🚀 Installation and Setup

### Prerequisites

Ensure the following tools are installed:

- Node.js and npm
- Go
- MongoDB Atlas account
- Redis server
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/VoteSphere.git
cd VoteSphere
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

`http://localhost:5173`

### 3. Backend Setup

Open another terminal:

```bash
cd backend
go mod download
go run .
```

The backend runs at:

`http://localhost:8080`

Configure the backend environment variables for your MongoDB connection, Redis connection, and JWT secret according to your backend configuration.

### 4. Redis Setup

Start Redis before running the backend.

For Ubuntu or WSL:

```bash
sudo service redis-server start
```

Verify Redis:

```bash
redis-cli ping
```

Expected response:

```text
PONG
```

### 5. Frontend API Configuration

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_URL=http://localhost:8080
```

Restart the Vite development server after changing environment variables.

## 📊 Polling Features

### Poll Creation

Authenticated users can create polls by entering a question, adding answer options, and selecting voting preferences.

### Voting

Participants can access polls through shareable links or QR codes. Voting is validated by the backend to reduce duplicate submissions.

### Live Results

VoteSphere uses Redis Pub/Sub and WebSockets to notify connected clients of new votes. Results are updated automatically without requiring a manual page refresh.

### Results Export

Poll creators can export their poll results in CSV format, including option names, vote counts, and percentage distribution.

### Poll Management

Creators can manage their polls from the dashboard, including closing and reopening polls, sharing links, and viewing results.

## 🔐 Security

- JWT-based authentication for protected endpoints.
- Backend validation of poll creation and vote submissions.
- Poll ownership checks for creator-only operations.
- Duplicate vote protection using database constraints.
- Controlled access to private poll results.

## 🎨 User Interface

VoteSphere features a modern interface with:

- Dark and light themes
- Responsive layouts
- Interactive poll cards
- Live voting indicators
- Visual result bars
- QR code sharing dialogs
- Dashboard analytics

## 🌐 Deployment

**Live Application:** Coming soon

Deployment links will be updated after hosting the frontend, backend, database, and Redis services.

## 🔮 Future Enhancements

- Scheduled poll creation
- Advanced participation analytics
- Additional chart visualizations
- Poll templates
- Enhanced administrative controls




