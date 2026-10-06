import { listOwnedBooks } from '../services/bookService.js';
import { updateAuthenticatedUserName } from '../services/authService.js';

export function listMyBooks(req, res, next) {
  try {
    res.status(200).json({ books: listOwnedBooks(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export function updateMe(req, res, next) {
  try {
    const user = updateAuthenticatedUserName(req.user.id, req.body);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
