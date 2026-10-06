import { requirePositiveId } from './ids.js';

export function validateCreateExchangeInput(body) {
  return {
    offeredBookId: requirePositiveId(body?.offered_book_id, 'offered_book_id'),
    requestedBookId: requirePositiveId(body?.requested_book_id, 'requested_book_id')
  };
}

export function parseExchangeId(value) {
  return requirePositiveId(value, 'id');
}
