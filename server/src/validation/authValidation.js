import { isNonEmptyString, requireFields } from './validate.js';
import { AppError } from '../utils/errors.js';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_NAME_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function normalizeName(name) {
  return name.trim();
}

export function validateName(name) {
  if (!isNonEmptyString(name)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Name is required.');
  }

  const normalized = normalizeName(name);

  if (normalized.length === 0 || normalized.length > MAX_NAME_LENGTH) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Name must be between 1 and 100 characters.'
    );
  }

  return normalized;
}

export function validateRegistrationInput(body) {
  requireFields(body, ['name', 'email', 'password']);

  const name = validateName(body.name);
  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  }

  validatePassword(password);

  return { name, email, password };
}

export function validateLoginInput(body) {
  requireFields(body, ['email', 'password']);

  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!EMAIL_PATTERN.test(email) || !isNonEmptyString(password)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  return { email, password };
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    throw new AppError(400, 'INVALID_PASSWORD', 'Password is required.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      400,
      'INVALID_PASSWORD',
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(
      400,
      'INVALID_PASSWORD',
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`
    );
  }
}
