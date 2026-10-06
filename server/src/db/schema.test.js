import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BOOK_CONDITIONS,
  BOOK_STATUSES,
  EXCHANGE_STATUSES
} from './constants.js';
import { closeDb, initializeDatabase } from './connection.js';
import { get, run } from './query.js';

function insertUser(email = 'alex@example.com') {
  return run(
    `INSERT INTO users (name, email, password_hash)
     VALUES (?, ?, ?)`,
    ['Alex', email, 'hashed-password']
  );
}

function insertBook(ownerId, overrides = {}) {
  return run(
    `INSERT INTO books (owner_id, title, author, description, condition, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      ownerId,
      overrides.title ?? 'The Hobbit',
      overrides.author ?? 'J.R.R. Tolkien',
      overrides.description ?? null,
      overrides.condition ?? 'GOOD',
      overrides.status ?? 'AVAILABLE'
    ]
  );
}

describe('database schema and constraints', () => {
  beforeEach(() => {
    initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDb();
  });

  it('initializes core tables, foreign keys, and timestamps', () => {
    const tables = get(
      `SELECT COUNT(*) AS count
       FROM sqlite_master
       WHERE type = 'table' AND name IN ('users', 'books', 'exchanges')`
    );
    const user = insertUser();
    const created = get('SELECT created_at, updated_at FROM users WHERE id = ?', [
      user.lastInsertRowid
    ]);

    expect(tables.count).toBe(3);
    expect(getDbForeignKeysEnabled()).toBe(1);
    expect(created.created_at).toBeTruthy();
    expect(created.updated_at).toBeTruthy();
  });

  it('can be initialized more than once without failing', () => {
    expect(() => initializeDatabase(':memory:')).not.toThrow();
    expect(insertUser('jordan@example.com').changes).toBe(1);
  });

  it('uses parameterized queries for inserts and lookups', () => {
    insertUser('owner@example.com');
    const user = get('SELECT id, email, password_hash FROM users WHERE email = ?', [
      'owner@example.com'
    ]);

    expect(user.email).toBe('owner@example.com');
    expect(user.password_hash).toBe('hashed-password');
  });

  it('rejects duplicate email addresses', () => {
    insertUser('alex@example.com');

    expect(() => insertUser('alex@example.com')).toThrow(/UNIQUE/i);
  });

  it('rejects books that reference a missing owner', () => {
    expect(() => insertBook(999)).toThrow(/FOREIGN KEY/i);
  });

  it('rejects exchanges that reference missing books or users', () => {
    const user = insertUser();

    expect(() =>
      run(
        `INSERT INTO exchanges (requester_id, offered_book_id, requested_book_id, status)
         VALUES (?, ?, ?, ?)`,
        [user.lastInsertRowid, 1, 2, 'PENDING']
      )
    ).toThrow(/FOREIGN KEY/i);
  });

  it('rejects invalid book conditions and statuses', () => {
    const user = insertUser();

    expect(() =>
      insertBook(user.lastInsertRowid, { condition: 'EXCELLENT' })
    ).toThrow(/CHECK/i);

    expect(() =>
      insertBook(user.lastInsertRowid, { status: 'SOLD' })
    ).toThrow(/CHECK/i);
  });

  it('accepts the allowed condition, book status, and exchange status values', () => {
    const ownerA = insertUser('a@example.com');
    const ownerB = insertUser('b@example.com');

    BOOK_CONDITIONS.forEach((condition, index) => {
      expect(
        insertBook(ownerA.lastInsertRowid, {
          title: `Book ${condition}`,
          condition,
          status: BOOK_STATUSES[index % BOOK_STATUSES.length]
        }).changes
      ).toBe(1);
    });

    const offered = insertBook(ownerA.lastInsertRowid, { title: 'Offered' });
    const requested = insertBook(ownerB.lastInsertRowid, { title: 'Requested' });

    EXCHANGE_STATUSES.forEach((status) => {
      expect(
        run(
          `INSERT INTO exchanges (requester_id, offered_book_id, requested_book_id, status)
           VALUES (?, ?, ?, ?)`,
          [ownerA.lastInsertRowid, offered.lastInsertRowid, requested.lastInsertRowid, status]
        ).changes
      ).toBe(1);
    });
  });

  it('rejects required-field violations', () => {
    expect(() =>
      run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [
        'missing-name@example.com',
        'hashed-password'
      ])
    ).toThrow(/NOT NULL/i);
  });

  it('allows only one pending exchange for the same requester and books', () => {
    const ownerA = insertUser('a-unique@example.com');
    const ownerB = insertUser('b-unique@example.com');
    const offered = insertBook(ownerA.lastInsertRowid, { title: 'Offered Unique' });
    const requested = insertBook(ownerB.lastInsertRowid, { title: 'Requested Unique' });

    run(
      `INSERT INTO exchanges (requester_id, offered_book_id, requested_book_id, status)
       VALUES (?, ?, ?, ?)`,
      [ownerA.lastInsertRowid, offered.lastInsertRowid, requested.lastInsertRowid, 'PENDING']
    );

    expect(() =>
      run(
        `INSERT INTO exchanges (requester_id, offered_book_id, requested_book_id, status)
         VALUES (?, ?, ?, ?)`,
        [ownerA.lastInsertRowid, offered.lastInsertRowid, requested.lastInsertRowid, 'PENDING']
      )
    ).toThrow(/UNIQUE/i);

    run(
      `UPDATE exchanges SET status = 'CANCELLED' WHERE requester_id = ? AND status = 'PENDING'`,
      [ownerA.lastInsertRowid]
    );

    expect(
      run(
        `INSERT INTO exchanges (requester_id, offered_book_id, requested_book_id, status)
         VALUES (?, ?, ?, ?)`,
        [ownerA.lastInsertRowid, offered.lastInsertRowid, requested.lastInsertRowid, 'PENDING']
      ).changes
    ).toBe(1);
  });
});

function getDbForeignKeysEnabled() {
  return get('PRAGMA foreign_keys').foreign_keys;
}
