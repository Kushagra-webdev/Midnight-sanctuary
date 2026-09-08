import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import focusRoutes from './routes/focusRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import postRoutes from './routes/postRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();
connectDB();

const app = express();
app.set('trust proxy', 1);

// ── Security Headers (Helmet) — graceful if not installed yet ─────────────────
try {
  const { default: helmet } = await import('helmet');
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  }));
  console.log('🛡  Helmet: ON');
} catch {
  console.warn('⚠️  helmet not installed — run: npm install');
}

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
}));

// ── Rate Limiting — graceful if not installed yet ─────────────────────────────
let generalLimiter = (req, res, next) => next();
let authLimiter    = (req, res, next) => next();
let aiLimiter      = (req, res, next) => next();

try {
  const { default: rateLimit } = await import('express-rate-limit');
  generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many requests. Try again later.' } });
  authLimiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  standardHeaders: true, legacyHeaders: false, message: { message: 'Too many auth attempts. Try again in 15 minutes.' } });
  aiLimiter      = rateLimit({ windowMs: 60 * 1000,       max: 10,  standardHeaders: true, legacyHeaders: false, message: { message: 'Too many AI requests. Slow down.' } });
  console.log('🚦 Rate Limiting: ON');
} catch {
  console.warn('⚠️  express-rate-limit not installed — run: npm install');
}

// app.use(generalLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/tasks',       taskRoutes);
app.use('/api/journals',    journalRoutes);
app.use('/api/focus',       focusRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts',       postRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/payments',    paymentRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: Math.floor(process.uptime()),
  version: '2.0.0',
}));

app.get('/', (req, res) => res.send('🌙 Midnight Sanctuary API v2.0'));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🌙 Midnight Sanctuary API v2.0`);
  console.log(`   Running on  : http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   AI          : Gemini 2.0 Flash`);
  console.log(`   Email       : ${process.env.EMAIL_HOST || 'Ethereal (dev)'}`);
  console.log(`   DB          : ${process.env.MONGO_URI ? 'MongoDB Atlas' : 'NOT SET'}\n`);
});
