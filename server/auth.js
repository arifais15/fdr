const crypto = require('crypto');

// In-memory session store: token -> { userid, createdAt, expiresAt }
const sessions = new Map();
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiter store: ip -> { attempts: count, lastAttempt: timestamp, lockedUntil: timestamp }
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MS = 30 * 1000; // 30 seconds lockout for desktop app convenience

/**
 * Hash a password using crypto.scryptSync with a 16-byte random salt.
 * Returns formatted string: "salt:hash"
 */
function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against a stored salt:hash string.
 */
function verifyPassword(password, storedValue) {
  if (!password || !storedValue) return false;
  
  if (storedValue.includes(':')) {
    const [salt, hash] = storedValue.split(':');
    if (!salt || !hash) return false;
    try {
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const hashBuffer = Buffer.from(hash, 'hex');
      if (hashBuffer.length !== derivedKey.length) return false;
      return crypto.timingSafeEqual(hashBuffer, derivedKey);
    } catch (e) {
      return false;
    }
  }
  
  // Backward compatibility fallback for unhashed passwords during initial migration
  return password === storedValue;
}

/**
 * Check if a stored password string is already in salt:hash format.
 */
function isHashed(storedValue) {
  if (!storedValue || typeof storedValue !== 'string') return false;
  const parts = storedValue.split(':');
  return parts.length === 2 && parts[0].length === 32 && parts[1].length === 128;
}

/**
 * Create a new session token for user.
 */
function createSession(userid, role = 'admin') {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  sessions.set(token, {
    userid,
    role,
    createdAt: now,
    expiresAt: now + SESSION_EXPIRY_MS
  });
  return token;
}

/**
 * Validate a session token.
 */
function validateSession(token) {
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return session;
}

/**
 * Revoke a session token.
 */
function revokeSession(token) {
  if (token) sessions.delete(token);
}

function revokeSessionsForUser(userid) {
  for (const [token, session] of sessions) {
    if (session.userid === userid) sessions.delete(token);
  }
}

/**
 * Rate Limiting for Login
 */
function checkRateLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    return { allowed: false, remainingSeconds };
  }
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordFailedLogin(ip) {
  const record = loginAttempts.get(ip) || { attempts: 0, lastAttempt: Date.now() };
  record.attempts += 1;
  record.lastAttempt = Date.now();
  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
    record.attempts = 0;
  }
  loginAttempts.set(ip, record);
}

function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}

/**
 * Express middleware to enforce authentication on protected API routes.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
  req.user = session;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  isHashed,
  createSession,
  validateSession,
  revokeSession,
  revokeSessionsForUser,
  checkRateLimit,
  recordFailedLogin,
  clearFailedLogins,
  requireAuth
};
