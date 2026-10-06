import { all, get, run } from './query.js';

const BOOK_COLUMNS = `
  books.id,
  books.title,
  books.author,
  books.description,
  books.condition,
  books.status,
  books.owner_id,
  books.created_at,
  books.updated_at,
  users.name AS owner_name
`;

export function createBookRecord({ ownerId, title, author, description, condition, status }) {
  return run(
    `INSERT INTO books (owner_id, title, author, description, condition, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ownerId, title, author, description, condition, status]
  );
}

export function findBookById(id) {
  return get(
    `SELECT ${BOOK_COLUMNS}
     FROM books
     INNER JOIN users ON users.id = books.owner_id
     WHERE books.id = ?`,
    [id]
  );
}

export function listAvailableBooks({ title, author, excludeOwnerId } = {}) {
  const conditions = ["books.status = 'AVAILABLE'"];
  const params = [];

  if (excludeOwnerId != null) {
    conditions.push('books.owner_id != ?');
    params.push(excludeOwnerId);
  }

  if (title) {
    conditions.push('books.title LIKE ? COLLATE NOCASE');
    params.push(`%${title}%`);
  }

  if (author) {
    conditions.push('books.author LIKE ? COLLATE NOCASE');
    params.push(`%${author}%`);
  }

  return all(
    `SELECT ${BOOK_COLUMNS}
     FROM books
     INNER JOIN users ON users.id = books.owner_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY books.created_at DESC, books.id DESC`,
    params
  );
}

export function listBooksByOwnerId(ownerId) {
  return all(
    `SELECT ${BOOK_COLUMNS}
     FROM books
     INNER JOIN users ON users.id = books.owner_id
     WHERE books.owner_id = ?
     ORDER BY books.created_at DESC, books.id DESC`,
    [ownerId]
  );
}

export function updateBookRecord(id, { title, author, description, condition, status }) {
  return run(
    `UPDATE books
     SET title = ?, author = ?, description = ?, condition = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, author, description, condition, status, id]
  );
}

export function deleteBookRecord(id) {
  return run('DELETE FROM books WHERE id = ?', [id]);
}

export function updateBookStatus(id, status, { requiredCurrentStatus } = {}) {
  if (requiredCurrentStatus) {
    return run(
      `UPDATE books
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = ?`,
      [status, id, requiredCurrentStatus]
    );
  }

  return run(
    `UPDATE books
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, id]
  );
}
