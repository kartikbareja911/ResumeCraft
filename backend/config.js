// Centralized server configuration with startup validation.
const path = require('path');

if (!process.env.LOADED_DOTENV) {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
  process.env.LOADED_DOTENV = 'true';
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// JWT secret must be explicitly set in production. In development a default is
// tolerated so the project runs out-of-the-box, but a warning is emitted.
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (isProduction) {
    console.error('FATAL: JWT_SECRET environment variable is required in production.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET not set. Using an insecure development default. Set JWT_SECRET before deploying.');
  return 'resumecraft_dev_secret_do_not_use_in_production';
})();

// Comma-separated allowlist of frontend origins. Requests without an Origin
// header (curl, same-origin static hosting, health checks) are always allowed.
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Gemini AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

module.exports = {
  NODE_ENV,
  isProduction,
  JWT_SECRET,
  CORS_ORIGIN,
  PORT: process.env.PORT || 5000,
  GEMINI_API_KEY,
  GEMINI_MODEL,
};
