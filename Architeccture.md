## 1. Complete Sitemap

### Public Views

```
/ - Landing Page (Hero, Problem, Features, Success Stories)

/pricing - Plans (Free, Pro, Premium)

/login & /signup - Authentication
```

### Protected Dashboard (The Sanctuary)

```
/app - Home Dashboard (Command Center, Daily Quote, Progress)

/app/profile - User Identity & Journey Progress

/app/communities - Forums, Trending, Discovery

/app/journal - Private Entries, Mood Tracking, Calendar

/app/todo - Task Management & Focus Metrics

/app/health - Wellness Hub (Yoga, Meditation, Nutrition)

/app/blocker - Website Blocker & Analytics

/app/coach - AI Mentor Chat Interface

/app/settings - Preferences & Account
```

## 2. Database Schema (MongoDB)

### Here is the high-level schema relationships for Express.js/Mongoose:

```
Users: _id, email, passwordHash, name, bio, avatarUrl, streakCount, activeDays, joinedCommunities[], planType

Tasks (Todo): _id, userId, title, isCompleted, priority, deadline, createdAt

JournalEntries: _id, userId, content, moodScore, tags[], createdAt

Communities: _id, name, description, members[], moderators[], createdAt

Posts: _id, communityId, authorId, content, likesCount, comments[], timestamp

FocusSessions (Blocker): _id, userId, duration, blockedSites[], date
```

## 3. Component Hierarchy (React) 

```bash
midnight-sanctuary/
├── client/                     # React frontend (Vite 8 + Tailwind v4)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── app/            # Dashboard, Journal, ToDo, Health, etc.
│   │   │   └── public/         # Landing, Auth, Pricing
│   │   ├── components/layouts/ # AppLayout, Sidebar, ProtectedRoute
│   │   ├── context/            # AuthContext
│   │   ├── hooks/              # useFetch, useTimer
│   │   └── services/           # api.js (Axios)
│   └── .env                    # VITE_API_URL
│
├── server/                     # Express backend (Node.js ESM)
│   ├── src/
│   │   ├── controllers/        # Auth, AI, Payment, CRUD logic
│   │   ├── routes/             # All API routes
│   │   ├── models/             # MongoDB schemas
│   │   ├── middlewares/        # JWT auth
│   │   ├── config/db.js        # MongoDB connection
|   |   └── utils
│   └── .env                    # All secrets
│
└── SETUP.md                    # This file
```