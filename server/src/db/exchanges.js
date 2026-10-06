import { all, get, run } from './query.js';

const EXCHANGE_COLUMNS = `
  exchanges.id,
  exchanges.status,
  exchanges.created_at,
  exchanges.updated_at,
  exchanges.requester_id,
  exchanges.offered_book_id,
  exchanges.requested_book_id,
  requester.name AS requester_name,
  offered.title AS offered_title,
  offered.author AS offered_author,
  offered.description AS offered_description,
  offered.condition AS offered_condition,
  offered.status AS offered_status,
  offered.owner_id AS offered_owner_id,
  offered_owner.name AS offered_owner_name,
  requested.title AS requested_title,
  requested.author AS requested_author,
  requested.description AS requested_description,
  requested.condition AS requested_condition,
  requested.status AS requested_status,
  requested.owner_id AS requested_owner_id,
  requested_owner.name AS requested_owner_name
`;

const EXCHANGE_JOINS = `
  FROM exchanges
  INNER JOIN users AS requester ON requester.id = exchanges.requester_id
  INNER JOIN books AS offered ON offered.id = exchanges.offered_book_id
  INNER JOIN users AS offered_owner ON offered_owner.id = offered.owner_id
  INNER JOIN books AS requested ON requested.id = exchanges.requested_book_id
  INNER JOIN users AS requested_owner ON requested_owner.id = requested.owner_id
`;

export function createExchangeRecord({
  requesterId,
  offeredBookId,
  requestedBookId,
  status
}) {
  return run(
    `INSERT INTO exchanges (requester_id, offered_book_id, requested_book_id, status)
     VALUES (?, ?, ?, ?)`,
    [requesterId, offeredBookId, requestedBookId, status]
  );
}

export function findExchangeById(id) {
  return get(
    `SELECT ${EXCHANGE_COLUMNS}
     ${EXCHANGE_JOINS}
     WHERE exchanges.id = ?`,
    [id]
  );
}

export function findPendingDuplicate({ requesterId, offeredBookId, requestedBookId }) {
  return get(
    `SELECT id
     FROM exchanges
     WHERE requester_id = ?
       AND offered_book_id = ?
       AND requested_book_id = ?
       AND status = 'PENDING'`,
    [requesterId, offeredBookId, requestedBookId]
  );
}

export function listSentExchanges(requesterId) {
  return all(
    `SELECT ${EXCHANGE_COLUMNS}
     ${EXCHANGE_JOINS}
     WHERE exchanges.requester_id = ?
     ORDER BY exchanges.created_at DESC, exchanges.id DESC`,
    [requesterId]
  );
}

export function listReceivedExchanges(userId) {
  return all(
    `SELECT ${EXCHANGE_COLUMNS}
     ${EXCHANGE_JOINS}
     WHERE requested.owner_id = ?
     ORDER BY exchanges.created_at DESC, exchanges.id DESC`,
    [userId]
  );
}

export function updateExchangeStatus(id, fromStatus, toStatus) {
  return run(
    `UPDATE exchanges
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status = ?`,
    [toStatus, id, fromStatus]
  );
}

export function bookIsReferencedByExchange(bookId) {
  return Boolean(
    get(
      `SELECT id
       FROM exchanges
       WHERE offered_book_id = ? OR requested_book_id = ?
       LIMIT 1`,
      [bookId, bookId]
    )
  );
}
