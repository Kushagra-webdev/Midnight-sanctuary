# 🌙 Midnight Sanctuary — Production

Midnight Sanctuary is a modern digital detox and personal growth platform designed to help individuals overcome digital addiction, build healthier habits, improve productivity, and connect with like-minded people on similar self-improvement journeys.

The platform combines habit building, community support, journaling, wellness resources, productivity tools, and AI-powered guidance into a single ecosystem focused on helping users reclaim control over their lives.

> Reclaim your focus. Find your stillness.

A full-stack MERN wellness app with AI coaching, journaling, blocker, communities, tasks, and health tracking.

---

## ✅ Features Implemented

| # | Feature | Status | Location |
|---|---------|--------|----------|
| 1 | 404 Page | ✅ | `client/src/pages/public/NotFound.jsx` |
| 2 | Password Reset / Forgot Password | ✅ | `authController.js` + `ResetPassword.jsx` |
| 3 | Email Notifications (nodemailer) | ✅ | `server/src/utils/sendEmail.js` |
| 4 | Search (journal + user search) | ✅ | `Journal.jsx` + `Communities.jsx` (Find People tab) |
| 5 | Dark / Light Mode Toggle | ✅ | `ThemeContext.jsx` + Sidebar + Settings |
| 6 | Notification Bell / In-App Notifications | ✅ | `NotificationBell.jsx` + userController |
| 7 | Onboarding Flow | ✅ | `OnboardingFlow.jsx` (shows on first login) |
| 8 | Streak Calendar Visualization | ✅ | `Dashboard.jsx` (49-day grid) |
| 9 | Export Journal Entries | ✅ | `journalController.js` (JSON + CSV) |
| 10 | Rate Limiting | ✅ | `server.js` — general/auth/AI limiters |
| 11 | Helmet (security headers) | ✅ | `server.js` |
| 12 | Health Timer Persistence (page refresh) | ✅ | `Health.jsx` + `useTimer.js` (localStorage) |
| 13 | PWA Manifest | ✅ | `client/public/manifest.json` + `index.html` |
| 14 | Comment System (UI + API) | ✅ | `Communities.jsx` + `postController.js` |
| 15 | Task Due Dates + Calendar View | ✅ | `ToDo.jsx` (inline calendar picker + 7-day view) |
| 16 | AI-Suggested Tasks from Journal | ✅ | `taskController.aiSuggestTasks` + `ToDo.jsx` |
| 17 | User Search / Follow System UI | ✅ | `Communities.jsx` (Find People tab) + userController |
| 18 | Focus Session History Chart | ✅ | `Health.jsx` — 14-day bar chart |
| 19 | Communities Real Member Count | ✅ | `communityController.js` (DB-driven) |
| 20 | Loading Skeleton Screens | ✅ | `SkeletonCard.jsx` — used across all pages |

---

## 📦 Stack

**Backend:** Express.js, MongoDB/Mongoose, JWT (httpOnly cookies), Helmet, express-rate-limit, nodemailer, Gemini 2.0 Flash AI, Razorpay

**Frontend:** React 19, React Router v7, Tailwind CSS v4, Axios, date-fns, react-hot-toast, lucide-react

---

## 🔐 Security

- **Helmet** — CSP, HSTS, X-Frame-Options, and 11 other headers
- **Rate Limiting** — 200 req/15min general, 20 req/15min auth, 10 req/min AI
- **JWT** — httpOnly cookies (XSS-safe)
- **bcrypt** — password hashing (10 rounds)
- **Password Reset** — crypto SHA-256 token, 1-hour expiry
- **User enumeration** — always 200 on forgot-password

---

## 📱 PWA

Add to home screen on mobile. Manifest includes shortcuts to Journal and Focus Timer.

---

## 📧 Email (Dev Mode)

In development (no EMAIL_* vars set), emails go to **Ethereal** (fake inbox).
The preview URL is logged in the server console:
```
📧 Email preview URL: https://ethereal.email/message/...
```

---

## 🎨 Theme

Toggle dark/light mode via:
- Sidebar toggle (sun/moon icon)
- Settings → Appearance tab
- Saved to `localStorage` and persists across sessions

---

## 📝 API Endpoints

```
POST  /api/auth/forgot-password     # Send reset link
POST  /api/auth/reset-password      # Reset with token
GET   /api/users/search?q=          # Search users
POST  /api/users/:id/follow         # Follow/unfollow
GET   /api/users/notifications      # Get notifications
PUT   /api/users/notifications/read # Mark all read
POST  /api/users/onboarding/complete
GET   /api/journals/export?format=json|csv
POST  /api/tasks/ai-suggest         # Pro feature
POST  /api/posts/:id/comments       # Add comment
DELETE /api/posts/:id/comments/:cid # Delete comment
POST  /api/communities/:id/join
DELETE /api/communities/:id/leave
```
