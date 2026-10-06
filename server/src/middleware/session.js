import session from 'express-session';
import { env } from '../config/env.js';

export const SESSION_COOKIE_NAME = 'easyExchange.sid';

export function createSessionMiddleware() {
  const secret = env.sessionSecret || process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  return session({
    name: SESSION_COOKIE_NAME,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production'
    }
  });
}
