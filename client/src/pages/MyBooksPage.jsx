import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { deleteBook, getMyBooks } from '../services/bookService.js';
import { getErrorMessage } from '../utils/errors.js';
import BookCard from '../components/BookCard.jsx';
import ConfirmationDialog from '../components/ConfirmationDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';

export default function MyBooksPage() {
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyBooks();
      setBooks(data.books || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your books.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteBook(pendingDelete.id);
      setPendingDelete(null);
      setMessage('Book deleted successfully.');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete this book.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>My Books</h2>
          <p className="page-intro">
            Everything you&apos;ve listed. Available books appear in the catalog for other
            readers to request.
          </p>
        </div>
        <Link className="button" to="/my-books/new">
          Add Book
        </Link>
      </div>
      {message ? <p className="notice success">{message}</p> : null}
      <ErrorMessage message={error} />
      {loading ? <LoadingIndicator label="Loading your books..." /> : null}
      {!loading && books.length === 0 ? (
        <EmptyState
          title="Your shelf is waiting"
          message="You haven't added any books yet."
          action={
            <Link className="button" to="/my-books/new">
              Add a Book
            </Link>
          }
        />
      ) : null}
      <div className="card-grid book-grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            showOwner={false}
            showStatus
            actions={
              <>
                <Link className="button secondary small" to={`/books/${book.id}`}>
                  View Details
                </Link>
                {book.status !== 'EXCHANGED' ? (
                  <>
                    <Link className="button secondary small" to={`/my-books/${book.id}/edit`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="danger-outline small"
                      onClick={() => setPendingDelete(book)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <p className="muted small-text">Exchanged books cannot be edited or deleted.</p>
                )}
              </>
            }
          />
        ))}
      </div>
      {pendingDelete ? (
        <ConfirmationDialog
          title="Delete Book?"
          message={`Are you sure you want to delete "${pendingDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          error={error}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </section>
  );
}
