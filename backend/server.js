const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { NODE_ENV, isProduction, CORS_ORIGIN, PORT } = require('./config');

const app = express();

// Behind a reverse proxy, honor X-Forwarded-For (required for rate limiting
// to see real client IPs). Enable with TRUST_PROXY=true in production.
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// General API rate limit (falls back to a 404 page, not server overload).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// Stricter limit for authentication endpoints (brute-force protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Basic welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ResumeCraft API',
    databaseMode: db.isFallback() ? 'Local file fallback (db.json)' : 'MongoDB active'
  });
});

// Health check for load balancers / uptime monitors (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    database: db.isFallback() ? 'db.json' : 'mongodb',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/ats', require('./routes/ats'));

// JSON 404 for unknown API paths (never the SPA shell)
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Pure API backend server. Frontend is served separately (e.g. via Vercel).

// Global error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal server error occurred' });
});

async function startServer() {
  // Connect database (handles fallback inside db.js)
  await db.connect();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${NODE_ENV})`);
    console.log(`Database status: ${db.isFallback() ? 'FALLBACK ACTIVE (db.json)' : 'MONGODB CONNECTED'}`);
    console.log(`CORS allowed origins: ${CORS_ORIGIN.join(', ')}`);
  });

  // Graceful shutdown for container orchestrators and process managers.
  async function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      try {
        await db.disconnect();
      } finally {
        process.exit(0);
      }
    });
    // Force-exit if connections refuse to close within 10s.
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
