import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteBook, getBook, updateBook } from '../services/bookService.js';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatBookStatus, formatCondition } from '../utils/format.js';
import BookCover from '../components/BookCover.jsx';
import ConfirmationDialog from '../components/ConfirmationDialog.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function BookDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getBook(id);
        if (!cancelled) {
          setBook(data.book);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load this book.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isOwner = book && user && Number(book.owner.id) === Number(user.id);
  const canRequest = book && !isOwner && book.status === 'AVAILABLE';
  const canManage = book && isOwner && book.status !== 'EXCHANGED';

  async function toggleAvailability() {
    setBusy(true);
    setError('');
    try {
      const nextStatus = book.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
      const data = await updateBook(book.id, { status: nextStatus });
      setBook(data.book);
      setFeedback(
        nextStatus === 'AVAILABLE'
          ? 'Book marked as available.'
          : 'Book marked as unavailable.'
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update availability.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteBook(book.id);
      navigate('/my-books', { replace: true, state: { message: 'Book deleted successfully.' } });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete this book.'));
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingIndicator label="Loading book details..." />;
  }

  if (error && !book) {
    return (
      <section className="stack">
        <ErrorMessage message={error} />
        <p>
          <Link to="/">Back to available books</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="book-detail">
      <div className="book-detail-cover">
        <BookCover title={book.title} author={book.author} size="lg" />
      </div>
      <div className="book-detail-body">
        <p className="eyebrow">{isOwner ? 'Your listing' : 'Book details'}</p>
        <h2 className="book-detail-title">{book.title}</h2>
        <p className="book-detail-author">by {book.author}</p>
        <div className="badge-row">
          <StatusBadge type="Condition" value={formatCondition(book.condition)} />
          <StatusBadge type="Availability" value={formatBookStatus(book.status)} />
        </div>
        <ErrorMessage message={error} />
        {feedback ? <p className="notice success">{feedback}</p> : null}
        <dl className="detail-list">
          <div>
            <dt>Author</dt>
            <dd>{book.author}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{isOwner ? `${book.owner.name} (you)` : book.owner.name}</dd>
          </div>
          <div>
            <dt>Condition</dt>
            <dd>{formatCondition(book.condition)}</dd>
          </div>
        </dl>
        <div className="book-detail-description">
          <h3>Description</h3>
          <p className={book.description ? undefined : 'muted'}>
            {book.description || 'No description provided.'}
          </p>
        </div>
        {book.status !== 'AVAILABLE' && !isOwner ? (
          <p className="notice info" role="status">
            This book cannot currently be requested.
          </p>
        ) : null}
        <div className="button-row">
          {canRequest ? (
            <Link className="button" to={`/books/${book.id}/propose`}>
              Propose Exchange
            </Link>
          ) : null}
          {canManage ? (
            <>
              <Link className="button secondary" to={`/my-books/${book.id}/edit`}>
                Edit
              </Link>
              <button
                type="button"
                className="secondary"
                onClick={toggleAvailability}
                disabled={busy}
              >
                {book.status === 'AVAILABLE' ? 'Mark unavailable' : 'Mark available'}
              </button>
              <button
                type="button"
                className="danger-outline"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                Delete
              </button>
            </>
          ) : null}
          <Link className="button ghost" to={isOwner ? '/my-books' : '/'}>
            Back
          </Link>
        </div>
      </div>
      {confirmDelete ? (
        <ConfirmationDialog
          title="Delete Book?"
          message={`Are you sure you want to delete "${book.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          error={error}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </section>
  );
}
