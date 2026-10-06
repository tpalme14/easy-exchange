import { SESSION_COOKIE_NAME } from '../middleware/session.js';
import {
  authenticateUser,
  registerUser
} from '../services/authService.js';

function createSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.userId = Number(userId);
      req.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }

        resolve();
      });
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }

    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);
    await createSession(req, user.id);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const user = await authenticateUser(req.body);
    await createSession(req, user.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await destroySession(req);
    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(200).json({ message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
}

export function getCurrentUser(req, res) {
  res.status(200).json({ user: req.user });
}
