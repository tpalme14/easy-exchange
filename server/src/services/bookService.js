import {
  createBookRecord,
  deleteBookRecord,
  findBookById,
  listAvailableBooks,
  listBooksByOwnerId,
  updateBookRecord
} from '../db/books.js';
import { bookIsReferencedByExchange } from '../db/exchanges.js';
import { AppError } from '../utils/errors.js';
import {
  parseBookId,
  validateCreateBookInput,
  validateUpdateBookInput
} from '../validation/bookValidation.js';

function toPublicBook(row) {
  return {
    id: Number(row.id),
    title: row.title,
    author: row.author,
    description: row.description,
    condition: row.condition,
    status: row.status,
    owner: {
      id: Number(row.owner_id),
      name: row.owner_name
    }
  };
}

function getBookOrThrow(id) {
  const bookId = parseBookId(id);

  if (bookId == null) {
    throw new AppError(404, 'BOOK_NOT_FOUND', 'The requested book was not found.');
  }

  const book = findBookById(bookId);

  if (!book) {
    throw new AppError(404, 'BOOK_NOT_FOUND', 'The requested book was not found.');
  }

  return book;
}

function assertOwner(book, userId) {
  if (Number(book.owner_id) !== Number(userId)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to modify this book.'
    );
  }
}

function assertEditable(book) {
  if (book.status === 'EXCHANGED') {
    throw new AppError(
      409,
      'BOOK_EXCHANGED',
      'Books involved in an accepted exchange cannot be changed.'
    );
  }
}

function sanitizeSearchTerm(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function listCatalogBooks(query = {}, currentUser = null) {
  const title = sanitizeSearchTerm(query.title);
  const author = sanitizeSearchTerm(query.author);
  const search = sanitizeSearchTerm(query.q);

  const filters = {
    excludeOwnerId: currentUser?.id
  };

  if (search) {
    const byTitle = listAvailableBooks({ ...filters, title: search });
    const byAuthor = listAvailableBooks({ ...filters, author: search });
    const seen = new Set();
    return [...byTitle, ...byAuthor]
      .filter((book) => {
        if (seen.has(Number(book.id))) {
          return false;
        }
        seen.add(Number(book.id));
        return true;
      })
      .map(toPublicBook);
  }

  return listAvailableBooks({
    ...filters,
    title,
    author
  }).map(toPublicBook);
}

export function getPublicBook(id) {
  return toPublicBook(getBookOrThrow(id));
}

export function listOwnedBooks(userId) {
  return listBooksByOwnerId(userId).map(toPublicBook);
}

export function createOwnedBook(userId, body) {
  const input = validateCreateBookInput(body);
  const result = createBookRecord({
    ownerId: userId,
    title: input.title,
    author: input.author,
    description: input.description,
    condition: input.condition,
    status: 'AVAILABLE'
  });

  return toPublicBook(findBookById(result.lastInsertRowid));
}

export function updateOwnedBook(userId, id, body) {
  const current = getBookOrThrow(id);
  assertOwner(current, userId);
  assertEditable(current);

  const input = validateUpdateBookInput(body, current);
  updateBookRecord(current.id, input);
  return toPublicBook(findBookById(current.id));
}

export function deleteOwnedBook(userId, id) {
  const current = getBookOrThrow(id);
  assertOwner(current, userId);
  assertEditable(current);

  if (bookIsReferencedByExchange(current.id)) {
    throw new AppError(
      409,
      'BOOK_IN_EXCHANGE',
      'This book cannot be deleted because it is associated with an exchange.'
    );
  }

  deleteBookRecord(current.id);
}
