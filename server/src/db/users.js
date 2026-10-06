import { get, run } from './query.js';

export function createUserRecord({ name, email, passwordHash }) {
  return run(
    `INSERT INTO users (name, email, password_hash)
     VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  );
}

export function findUserByEmail(email) {
  return get(
    `SELECT id, name, email, password_hash, created_at, updated_at
     FROM users
     WHERE email = ?`,
    [email]
  );
}

export function findUserById(id) {
  return get(
    `SELECT id, name, email, password_hash, created_at, updated_at
     FROM users
     WHERE id = ?`,
    [id]
  );
}

export function updateUserName(id, name) {
  return run(
    `UPDATE users
     SET name = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, id]
  );
}
