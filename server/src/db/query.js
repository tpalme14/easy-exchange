import { getDb } from './connection.js';

export function all(sql, params = []) {
  return getDb().prepare(sql).all(...params);
}

export function get(sql, params = []) {
  return getDb().prepare(sql).get(...params);
}

export function run(sql, params = []) {
  return getDb().prepare(sql).run(...params);
}

export function withTransaction(work, { immediate = false } = {}) {
  const database = getDb();
  database.exec(immediate ? 'BEGIN IMMEDIATE' : 'BEGIN');

  try {
    const result = work();
    database.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      database.exec('ROLLBACK');
    } catch {
      // The transaction may already have ended.
    }
    throw err;
  }
}
