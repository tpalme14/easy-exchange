import { createUserRecord, findUserByEmail, findUserById, updateUserName } from '../db/users.js';
import { AppError } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  validateLoginInput,
  validateName,
  validateRegistrationInput
} from '../validation/authValidation.js';

let dummyPasswordHash;

function toPublicUser(user) {
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email
  };
}

async function getDummyPasswordHash() {
  if (!dummyPasswordHash) {
    dummyPasswordHash = await hashPassword('not-used-for-authentication');
  }

  return dummyPasswordHash;
}

function isUniqueConstraintError(err) {
  return String(err?.message || '').includes('UNIQUE constraint failed');
}

export async function registerUser(body) {
  const { name, email, password } = validateRegistrationInput(body);

  if (findUserByEmail(email)) {
    throw new AppError(
      409,
      'EMAIL_ALREADY_EXISTS',
      'An account with this email already exists.'
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = createUserRecord({ name, email, passwordHash });
    const user = findUserById(result.lastInsertRowid);
    return toPublicUser(user);
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new AppError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'An account with this email already exists.'
      );
    }

    throw err;
  }
}

export async function authenticateUser(body) {
  const { email, password } = validateLoginInput(body);
  const user = findUserByEmail(email);
  const passwordHash = user?.password_hash || (await getDummyPasswordHash());
  const passwordMatches = await verifyPassword(password, passwordHash);

  if (!user || !passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  return toPublicUser(user);
}

export function getAuthenticatedUser(userId) {
  if (userId == null) {
    return null;
  }

  const user = findUserById(userId);
  return user ? toPublicUser(user) : null;
}

export function updateAuthenticatedUserName(userId, body) {
  const name = validateName(body?.name);
  const result = updateUserName(userId, name);

  if (result.changes !== 1) {
    throw new AppError(404, 'NOT_FOUND', 'The requested user was not found.');
  }

  return getAuthenticatedUser(userId);
}

export { toPublicUser };
