import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { deleteBook, getMyBooks } from '../services/bookService.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatBookStatus, formatCondition } from '../utils/format.js';
import ConfirmationDialog from '../components/ConfirmationDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

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
        <h2>My Books</h2>
        <Link className="button" to="/my-books/new">
          Add Book
        </Link>
      </div>
      {message ? <p className="notice success">{message}</p> : null}
      <ErrorMessage message={error} />
      {loading ? <LoadingIndicator label="Loading your books..." /> : null}
      {!loading && books.length === 0 ? (
        <EmptyState
          message="You haven't added any books yet."
          action={
            <Link className="button" to="/my-books/new">
              Add a Book
            </Link>
          }
        />
      ) : null}
      <div className="card-grid">
        {books.map((book) => (
          <article className="card" key={book.id}>
            <h3>{book.title}</h3>
            <p>{book.author}</p>
            <p>
              <StatusBadge type="Condition" value={formatCondition(book.condition)} />
            </p>
            <p>
              <StatusBadge type="Status" value={formatBookStatus(book.status)} />
            </p>
            <div className="button-row">
              <Link className="button secondary" to={`/books/${book.id}`}>
                View Details
              </Link>
              {book.status !== 'EXCHANGED' ? (
                <>
                  <Link className="button secondary" to={`/my-books/${book.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setPendingDelete(book)}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <p className="muted">Exchanged books cannot be edited or deleted.</p>
              )}
            </div>
          </article>
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
