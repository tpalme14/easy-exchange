import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBook, getMyBooks } from '../services/bookService.js';
import { createExchange } from '../services/exchangeService.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatCondition } from '../utils/format.js';
import BookCover from '../components/BookCover.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';

export default function ProposeExchangePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requested, setRequested] = useState(null);
  const [owned, setOwned] = useState([]);
  const [offeredId, setOfferedId] = useState('');
  const [step, setStep] = useState('select');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [bookData, myBooks] = await Promise.all([getBook(id), getMyBooks()]);
        if (cancelled) {
          return;
        }
        setRequested(bookData.book);
        setOwned((myBooks.books || []).filter((book) => book.status === 'AVAILABLE'));
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to start this exchange.'));
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

  const offered = owned.find((book) => String(book.id) === String(offeredId));

  async function handleSubmit() {
    setBusy(true);
    setError('');
    try {
      await createExchange({
        offered_book_id: Number(offeredId),
        requested_book_id: Number(id)
      });
      navigate('/exchanges', {
        replace: true,
        state: { message: 'Exchange proposal submitted.' }
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit this exchange.'));
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingIndicator label="Loading exchange details..." />;
  }

  if (!requested) {
    return <ErrorMessage message={error || 'Book not found.'} />;
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {step === 'confirm' ? 'Step 2 of 2 · Review and confirm' : 'Step 1 of 2 · Choose a book'}
          </p>
          <h2>{step === 'confirm' ? 'Confirm Exchange' : 'Propose Exchange'}</h2>
        </div>
      </div>
      <ErrorMessage message={error} />
      {step === 'select' ? (
        <div className="exchange-summary">
          <div className="exchange-builder">
            <div className="card exchange-panel">
              <label className="panel-label">
                You Offer
                <select
                  value={offeredId}
                  onChange={(event) => setOfferedId(event.target.value)}
                >
                  <option value="">Select one of your available books</option>
                  {owned.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} · {formatCondition(book.condition)}
                    </option>
                  ))}
                </select>
              </label>
              {offered ? (
                <div className="exchange-preview">
                  <BookCover title={offered.title} author={offered.author} size="sm" />
                  <div>
                    <p className="exchange-book-title">{offered.title}</p>
                    <p className="muted">{offered.author}</p>
                  </div>
                </div>
              ) : owned.length > 0 ? (
                <p className="muted">Choose the book you&apos;d like to give in return.</p>
              ) : null}
              {owned.length === 0 ? (
                <p className="notice info">
                  You need an available book to offer.{' '}
                  <Link to="/my-books/new">Add a Book</Link>
                </p>
              ) : null}
            </div>
            <span className="exchange-arrow" aria-hidden="true">
              ⇄
            </span>
            <article className="card exchange-panel">
              <h3 className="panel-label">You Request</h3>
              <div className="exchange-preview">
                <BookCover title={requested.title} author={requested.author} size="sm" />
                <div>
                  <p className="exchange-book-title">{requested.title}</p>
                  <p className="muted">{requested.author}</p>
                  <p className="small-text">{formatCondition(requested.condition)} condition</p>
                  <p className="small-text">Owner: {requested.owner.name}</p>
                </div>
              </div>
            </article>
          </div>
          <div className="button-row">
            <Link className="button secondary" to={`/books/${id}`}>
              Cancel
            </Link>
            <button
              type="button"
              disabled={!offeredId}
              onClick={() => setStep('confirm')}
            >
              Review Exchange
            </button>
          </div>
        </div>
      ) : (
        <div className="exchange-summary">
          <div className="exchange-builder">
            <article className="card exchange-panel">
              <h3 className="panel-label">You are offering</h3>
              <div className="exchange-preview">
                <BookCover title={offered?.title} author={offered?.author} size="sm" />
                <div>
                  <p className="exchange-book-title">{offered?.title}</p>
                  <p className="muted">{offered?.author}</p>
                  <p className="small-text">{formatCondition(offered?.condition)} condition</p>
                </div>
              </div>
            </article>
            <span className="exchange-arrow" aria-hidden="true">
              ⇄
            </span>
            <article className="card exchange-panel">
              <h3 className="panel-label">In exchange for</h3>
              <div className="exchange-preview">
                <BookCover title={requested.title} author={requested.author} size="sm" />
                <div>
                  <p className="exchange-book-title">{requested.title}</p>
                  <p className="muted">{requested.author}</p>
                  <p className="small-text">{formatCondition(requested.condition)} condition</p>
                </div>
              </div>
            </article>
          </div>
          <div className="confirm-note">
            <p>
              To: <strong>{requested.owner.name}</strong>
            </p>
            <p className="muted">This proposal cannot be changed after submission.</p>
          </div>
          <div className="button-row">
            <button type="button" className="secondary" onClick={() => setStep('select')}>
              Back
            </button>
            <button type="button" onClick={handleSubmit} disabled={busy}>
              {busy ? 'Submitting...' : 'Submit Exchange'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
