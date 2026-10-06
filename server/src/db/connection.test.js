import { afterEach, describe, expect, it } from 'vitest';
import { closeDb, createDatabase, initializeDatabase } from './connection.js';
import { get } from './query.js';

describe('database initialization', () => {
  afterEach(() => {
    closeDb();
  });

  it('creates an in-memory database with foreign keys enabled', () => {
    const database = initializeDatabase(':memory:');
    const foreignKeys = database.prepare('PRAGMA foreign_keys').get().foreign_keys;
    const ping = get('SELECT 1 AS ok');

    expect(foreignKeys).toBe(1);
    expect(ping.ok).toBe(1);
  });

  it('creates a new connection with the schema applied', () => {
    const database = createDatabase(':memory:');
    const tables = database
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name IN ('users', 'books', 'exchanges')
         ORDER BY name`
      )
      .all()
      .map((row) => row.name);

    database.close();

    expect(tables).toEqual(['books', 'exchanges', 'users']);
  });
});
