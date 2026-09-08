# 🌙 Midnight Sanctuary — Setup Guide

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| MongoDB Community | 7+ | https://www.mongodb.com/try/download/community |
| Git | Any | https://git-scm.com |
| VS Code | Any | https://code.visualstudio.com |

---

## Step 1 — Open in VS Code

```bash
# Open the project folder in VS Code
code reclaim-production
```

Or: File → Open Folder → select `reclaim-production`

**Recommended VS Code Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- MongoDB for VS Code

---

## Step 2 — Install Dependencies

Open VS Code terminal: `` Ctrl+` `` (backtick) or Terminal → New Terminal

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Step 3 — Configure Environment

In VS Code Explorer, open `server/.env` and fill in your values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/midnight-sanctuary
JWT_SECRET=make_this_a_long_random_string_at_least_32_chars

# Gemini AI (FREE) — get at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSy...

# Razorpay (OPTIONAL) — get test keys at: https://dashboard.razorpay.com/app/keys
# If left blank, the app runs in DEMO MODE (payments still work, just not real)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

CLIENT_URL=http://localhost:5173
```

### Getting your Gemini API Key (free):
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste into `server/.env`

---

## Step 4 — Start MongoDB

**Windows:**
```bash
# If installed as a service, it may already be running
# Or start manually:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**macOS:**
```bash
brew services start mongodb-community
# Or: mongod --config /usr/local/etc/mongod.conf
```

**Linux:**
```bash
sudo systemctl start mongod
# Or: sudo service mongod start
```

**Verify MongoDB is running:**
```bash
mongosh
# You should see a prompt. Type 'exit' to quit.
```

---

## Step 5 — Run the App

You need **two terminals** open simultaneously.

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
You should see:
```
🌙 Midnight Sanctuary API running on port 5000 [development]
   AI: Gemini 2.0 Flash
   Payments: Razorpay
MongoDB Connected: localhost
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
You should see:
```
  VITE v8.x.x  ready in 500ms
  ➜  Local:   http://localhost:5173/
```

**Open your browser:** http://localhost:5173

---

## Step 6 — Create Your Account

1. Click **"Get Started"** or **"Log In"**
2. Click **"Join the Sanctuary"** to register
3. Enter your name, email, and password (min 6 chars)
4. You're in!

### Test the AI Guide (requires Gemini key):
1. Go to **Settings** → click **"Upgrade"** on The Disciplined plan
2. (Demo mode — no real payment needed)
3. Go to **AI Guide** and start chatting

---

## VS Code Tips

### Split Terminals (run both servers at once):
1. Open terminal: `` Ctrl+` ``
2. Click the **+** icon to add a second terminal
3. Run backend in one, frontend in the other

### Recommended settings.json additions:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Folder Structure

```
midnight-sanctuary/
├── client/                    # React frontend (Vite 8 + Tailwind v4)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── app/           # Dashboard, Journal, ToDo, Health, etc.
│   │   │   └── public/        # Landing, Auth, Pricing
│   │   ├── components/layouts/ # AppLayout, Sidebar, ProtectedRoute
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # useFetch, useTimer
│   │   └── services/          # api.js (Axios)
│   └── .env                   # VITE_API_URL
│
├── server/                    # Express backend (Node.js ESM)
│   ├── src/
│   │   ├── controllers/       # Auth, AI, Payment, CRUD logic
│   │   ├── routes/            # All API routes
│   │   ├── models/            # MongoDB schemas
│   │   ├── middlewares/       # JWT auth
│   │   ├── config/db.js       # MongoDB connection
|   |   └── utils
│   └── .env                   # All secrets (never commit this!)
│
└── SETUP.md                   # This file
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED 5000` | Backend isn't running. Start it with `npm run dev` in `/server` |
| `MongoNetworkError` | MongoDB not running. Start it (see Step 4) |
| AI says "unavailable" | Check `GEMINI_API_KEY` in `server/.env` |
| Login fails with 401 | JWT_SECRET may be missing in `.env` |
| Port 5173 in use | Kill the process or change Vite port in `vite.config.js` |
| `npm install` fails | Try `npm install --legacy-peer-deps` |
| CORS error | Make sure `CLIENT_URL=http://localhost:5173` in server `.env` |

---

## Production Build

```bash
# Build frontend for production
cd client
npm run build
# Output goes to client/dist/

# The dist/ folder can be:
# 1. Deployed to Vercel/Netlify (drag & drop or CLI)
# 2. Served by Express: app.use(express.static('../client/dist'))
# 3. Deployed to any static hosting

# Deploy backend to:
# - Railway: https://railway.app (easiest)
# - Render: https://render.com
# - Fly.io: https://fly.io
```

---

## Quick Commands Reference

```bash
# Backend
cd server && npm run dev        # Start with hot reload
cd server && npm start          # Start without hot reload (production)

# Frontend  
cd client && npm run dev        # Start dev server
cd client && npm run build      # Build for production
cd client && npm run preview    # Preview production build locally

# MongoDB
mongosh                         # Open MongoDB shell
mongosh midnight-sanctuary      # Connect to app database
```
