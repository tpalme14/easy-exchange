import { findBookById, updateBookStatus } from '../db/books.js';
import {
  createExchangeRecord,
  findExchangeById,
  findPendingDuplicate,
  listReceivedExchanges,
  listSentExchanges,
  updateExchangeStatus
} from '../db/exchanges.js';
import { withTransaction } from '../db/query.js';
import { AppError } from '../utils/errors.js';
import { parsePositiveId } from '../validation/ids.js';
import { validateCreateExchangeInput } from '../validation/exchangeValidation.js';

function toPublicExchange(row) {
  return {
    id: Number(row.id),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    requester: {
      id: Number(row.requester_id),
      name: row.requester_name
    },
    offeredBook: {
      id: Number(row.offered_book_id),
      title: row.offered_title,
      author: row.offered_author,
      description: row.offered_description,
      condition: row.offered_condition,
      status: row.offered_status,
      owner: {
        id: Number(row.offered_owner_id),
        name: row.offered_owner_name
      }
    },
    requestedBook: {
      id: Number(row.requested_book_id),
      title: row.requested_title,
      author: row.requested_author,
      description: row.requested_description,
      condition: row.requested_condition,
      status: row.requested_status,
      owner: {
        id: Number(row.requested_owner_id),
        name: row.requested_owner_name
      }
    }
  };
}

function getExchangeRow(id) {
  const exchangeId = parsePositiveId(id);

  if (exchangeId == null) {
    throw new AppError(404, 'EXCHANGE_NOT_FOUND', 'The requested exchange was not found.');
  }

  const exchange = findExchangeById(exchangeId);

  if (!exchange) {
    throw new AppError(404, 'EXCHANGE_NOT_FOUND', 'The requested exchange was not found.');
  }

  return exchange;
}

function isParticipant(exchange, userId) {
  return (
    Number(exchange.requester_id) === Number(userId) ||
    Number(exchange.requested_owner_id) === Number(userId)
  );
}

function assertParticipant(exchange, userId) {
  if (!isParticipant(exchange, userId)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to view this exchange.'
    );
  }
}

function assertRequestedOwner(exchange, userId) {
  if (Number(exchange.requested_owner_id) !== Number(userId)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only the requested book owner can perform this action.'
    );
  }
}

function assertRequester(exchange, userId) {
  if (Number(exchange.requester_id) !== Number(userId)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Only the requester can cancel this exchange.'
    );
  }
}

function assertPending(exchange) {
  if (exchange.status !== 'PENDING') {
    throw new AppError(
      409,
      'EXCHANGE_NOT_PENDING',
      'Only pending exchanges can be changed.'
    );
  }
}

function requireBook(id, fieldName) {
  const bookId = parsePositiveId(id);

  if (bookId == null) {
    throw new AppError(404, 'BOOK_NOT_FOUND', `The ${fieldName} was not found.`);
  }

  const book = findBookById(bookId);

  if (!book) {
    throw new AppError(404, 'BOOK_NOT_FOUND', `The ${fieldName} was not found.`);
  }

  return book;
}

function assertBookAvailable(book, label) {
  if (book.status !== 'AVAILABLE') {
    throw new AppError(
      409,
      'BOOK_UNAVAILABLE',
      `The ${label} is not available for exchange.`
    );
  }
}

function isUniqueConstraintError(err) {
  return String(err?.message || '').includes('UNIQUE constraint failed');
}

export function createExchangeProposal(userId, body) {
  const { offeredBookId, requestedBookId } = validateCreateExchangeInput(body);

  if (offeredBookId === requestedBookId) {
    throw new AppError(
      400,
      'INVALID_EXCHANGE',
      'The offered and requested books must be different.'
    );
  }

  const offeredBook = requireBook(offeredBookId, 'offered book');
  const requestedBook = requireBook(requestedBookId, 'requested book');

  if (Number(offeredBook.owner_id) !== Number(userId)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You can only offer a book that you own.'
    );
  }

  if (Number(requestedBook.owner_id) === Number(userId)) {
    throw new AppError(
      400,
      'INVALID_EXCHANGE',
      'You cannot propose an exchange with yourself.'
    );
  }

  assertBookAvailable(offeredBook, 'offered book');
  assertBookAvailable(requestedBook, 'requested book');

  if (
    findPendingDuplicate({
      requesterId: userId,
      offeredBookId,
      requestedBookId
    })
  ) {
    throw new AppError(
      409,
      'DUPLICATE_EXCHANGE',
      'A pending exchange for these books already exists.'
    );
  }

  try {
    const result = createExchangeRecord({
      requesterId: userId,
      offeredBookId,
      requestedBookId,
      status: 'PENDING'
    });

    return toPublicExchange(findExchangeById(result.lastInsertRowid));
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new AppError(
        409,
        'DUPLICATE_EXCHANGE',
        'A pending exchange for these books already exists.'
      );
    }

    throw err;
  }
}

export function listSentExchangeProposals(userId) {
  return listSentExchanges(userId).map(toPublicExchange);
}

export function listReceivedExchangeProposals(userId) {
  return listReceivedExchanges(userId).map(toPublicExchange);
}

export function getVisibleExchange(userId, id) {
  const exchange = getExchangeRow(id);
  assertParticipant(exchange, userId);
  return toPublicExchange(exchange);
}

export function acceptExchangeProposal(userId, id) {
  return withTransaction(() => {
    const exchange = getExchangeRow(id);
    assertRequestedOwner(exchange, userId);
    assertPending(exchange);

    const offeredBook = requireBook(exchange.offered_book_id, 'offered book');
    const requestedBook = requireBook(exchange.requested_book_id, 'requested book');

    if (Number(requestedBook.owner_id) !== Number(userId)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Only the requested book owner can perform this action.'
      );
    }

    assertBookAvailable(offeredBook, 'offered book');
    assertBookAvailable(requestedBook, 'requested book');

    const exchangeUpdate = updateExchangeStatus(exchange.id, 'PENDING', 'ACCEPTED');
    const offeredUpdate = updateBookStatus(offeredBook.id, 'EXCHANGED', {
      requiredCurrentStatus: 'AVAILABLE'
    });
    const requestedUpdate = updateBookStatus(requestedBook.id, 'EXCHANGED', {
      requiredCurrentStatus: 'AVAILABLE'
    });

    if (
      exchangeUpdate.changes !== 1 ||
      offeredUpdate.changes !== 1 ||
      requestedUpdate.changes !== 1
    ) {
      throw new AppError(
        409,
        'EXCHANGE_CONFLICT',
        'The exchange could not be completed because a selected book is no longer available.'
      );
    }

    return toPublicExchange(findExchangeById(exchange.id));
  }, { immediate: true });
}

export function rejectExchangeProposal(userId, id) {
  const exchange = getExchangeRow(id);
  assertRequestedOwner(exchange, userId);
  assertPending(exchange);

  const result = updateExchangeStatus(exchange.id, 'PENDING', 'REJECTED');

  if (result.changes !== 1) {
    throw new AppError(
      409,
      'EXCHANGE_NOT_PENDING',
      'Only pending exchanges can be changed.'
    );
  }

  return toPublicExchange(findExchangeById(exchange.id));
}

export function cancelExchangeProposal(userId, id) {
  const exchange = getExchangeRow(id);
  assertRequester(exchange, userId);
  assertPending(exchange);

  const result = updateExchangeStatus(exchange.id, 'PENDING', 'CANCELLED');

  if (result.changes !== 1) {
    throw new AppError(
      409,
      'EXCHANGE_NOT_PENDING',
      'Only pending exchanges can be changed.'
    );
  }

  return toPublicExchange(findExchangeById(exchange.id));
}
