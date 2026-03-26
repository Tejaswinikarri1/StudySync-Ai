<h1 align="center">📚 StudySync AI — Smart Study Collaboration Platform</h1>

<p align="center"> <b>If you found this project helpful, give it a ⭐️</b> </p>

<p align="center">
</p>

---


---

## 🚀 About the Project

**StudySync AI** is a full-stack intelligent study collaboration platform designed to help students connect, collaborate, and stay productive.

It combines real-time communication, AI-powered matching, and analytics tracking to create a focused and engaging learning environment.

---

## ✨ Features

- 🔐 Secure Authentication (JWT-based login & signup)
- 🤝 AI Study Partner Matching
- 👥 Group Study Rooms with Invite Codes
- 💬 Real-time Chat (Group + DM)
- 📅 Study Session Scheduling & Tracking
- 📊 Analytics Dashboard (Study Insights)
- 🏆 Leaderboard System
- ⏱️ Focus Timer for Productivity
- 🔔 Notifications & Email Integration

---

## 🛠️ Tech Stack

### 💻 Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- Chart.js

### ⚙️ Backend
- Node.js + Express.js
- JWT Authentication + Bcrypt

### 🗄️ Database
- MongoDB + Mongoose

### 🔄 Real-time
- Socket.io

### 📧 Email Service
- Nodemailer (SMTP / Gmail)

---



---

## 📁 Project Structure




```
studysync-fullstack/
├── backend/                  # Node.js Express API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── groupController.js
│   │   ├── sessionController.js
│   │   ├── messageController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   └── errorHandler.js
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Message.js
│   │   ├── Session.js
│   │   ├── Connection.js
│   │   ├── StudyLog.js
│   │   └── Notification.js
│   ├── routes/               # Express routers
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── groups.js
│   │   ├── sessions.js
│   │   ├── messages.js
│   │   └── analytics.js
│   ├── utils/
│   │   └── email.js          # Nodemailer helper
│   ├── server.js             # Entry point + Socket.io
│   ├── .env.example
│   └── package.json
│
└── frontend/                 # React + Vite app
    ├── src/
    │   ├── api/
    │   │   └── axios.js      # Axios instance + interceptors
    │   ├── context/
    │   │   └── AppContext.jsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── Topbar.jsx
    │   │   ├── ui/
    │   │   │   └── index.jsx  # Shared UI components
    │   │   └── FloatingAI.jsx
    │   ├── pages/
    │   │   ├── SignUp.jsx
    │   │   ├── SignIn.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Matches.jsx
    │   │   ├── Groups.jsx
    │   │   ├── Chat.jsx
    │   │   ├── Sessions.jsx
    │   │   ├── Analytics.jsx
    │   │   ├── Leaderboard.jsx
    │   │   ├── Profile.jsx
    │   │   ├── FocusTimer.jsx
    │   │   ├── Schedule.jsx
    │   │   └── Notes.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Quick Start

---

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/studysync-fullstack.git

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/studysync
# OR MongoDB Atlas:
# MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/studysync

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Nodemailer (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password   # Use App Password, not regular password
EMAIL_FROM=StudySync AI <noreply@studysync.ai>

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Run MongoDB

```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas (cloud) — just set MONGO_URI in .env
```

### 4. Start the App

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET  | `/api/auth/verify/:token` | Verify email |

### Users
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/users/me` | Get current user profile |
| PUT  | `/api/users/me` | Update profile |
| GET  | `/api/users/matches` | Get AI-matched partners |
| POST | `/api/users/connect/:id` | Send connection request |
| PUT  | `/api/users/connect/:id/accept` | Accept connection |
| PUT  | `/api/users/connect/:id/decline` | Decline connection |
| GET  | `/api/users/connections` | Get all connections |
| GET  | `/api/users/leaderboard` | Get leaderboard |

### Groups
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/groups` | Get all groups |
| POST | `/api/groups` | Create group |
| POST | `/api/groups/join/:code` | Join by invite code |
| GET  | `/api/groups/:id/messages` | Get group messages |
| POST | `/api/groups/:id/messages` | Send group message |
| POST | `/api/groups/:id/invite` | Regenerate invite code |

### Sessions
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/sessions` | Get user's sessions |
| POST | `/api/sessions` | Create session |
| PUT  | `/api/sessions/:id/complete` | Mark session complete |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/analytics` | Get user analytics |
| POST | `/api/analytics/log` | Log study activity |

### Messages (DM)
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/messages/:userId` | Get DM thread |
| POST | `/api/messages/:userId` | Send DM |

---

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_room` | Client → Server | `{ groupId }` |
| `leave_room` | Client → Server | `{ groupId }` |
| `group_message` | Client → Server | `{ groupId, text }` |
| `new_group_message` | Server → Client | `message object` |
| `dm_message` | Client → Server | `{ toUserId, text }` |
| `new_dm_message` | Server → Client | `message object` |
| `typing` | Client → Server | `{ groupId }` |
| `user_typing` | Server → Client | `{ userId, name }` |

---

## Database Collections

- **users** — profiles, auth, stats, badges
- **groups** — study groups with invite codes
- **messages** — group & DM messages
- **sessions** — scheduled study sessions
- **connections** — friend/partner connections
- **studylogs** — timer & session activity logs
- **notifications** — system notifications

---

---

## 🤝 Contributing

We welcome contributions from the community!  
If you have ideas, suggestions, or improvements, feel free to:

- Fork the repository  
- Create a new branch  
- Make your changes  
- Submit a pull request  

---

## 👩‍💻 Created By

**Tejaswini Reddy**

---

## ❤️ Support

If you found this project useful, please consider:

- ⭐ Starring the repository  
- 🍴 Forking the project  
- 📢 Sharing it with others  

---
