import {
  createOwnedBook,
  deleteOwnedBook,
  getPublicBook,
  listCatalogBooks,
  listOwnedBooks,
  updateOwnedBook
} from '../services/bookService.js';

export function listBooks(req, res, next) {
  try {
    res.status(200).json({ books: listCatalogBooks(req.query, req.user || null) });
  } catch (err) {
    next(err);
  }
}

export function getBook(req, res, next) {
  try {
    res.status(200).json({ book: getPublicBook(req.params.id) });
  } catch (err) {
    next(err);
  }
}

export function createBook(req, res, next) {
  try {
    const book = createOwnedBook(req.user.id, req.body);
    res.status(201).json({ book });
  } catch (err) {
    next(err);
  }
}

export function updateBook(req, res, next) {
  try {
    const book = updateOwnedBook(req.user.id, req.params.id, req.body);
    res.status(200).json({ book });
  } catch (err) {
    next(err);
  }
}

export function deleteBook(req, res, next) {
  try {
    deleteOwnedBook(req.user.id, req.params.id);
    res.status(200).json({ message: 'Book deleted.' });
  } catch (err) {
    next(err);
  }
}
