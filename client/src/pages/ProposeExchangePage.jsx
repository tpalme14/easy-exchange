import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBook, getMyBooks } from '../services/bookService.js';
import { createExchange } from '../services/exchangeService.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatCondition } from '../utils/format.js';
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
      <h2>{step === 'confirm' ? 'Confirm Exchange' : 'Propose Exchange'}</h2>
      <ErrorMessage message={error} />
      {step === 'select' ? (
        <div className="exchange-summary">
          <article className="card">
            <h3>You Request</h3>
            <p>{requested.title}</p>
            <p>{requested.author}</p>
            <p>{formatCondition(requested.condition)} condition</p>
            <p>Owner: {requested.owner.name}</p>
          </article>
          <label>
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
          {owned.length === 0 ? (
            <p className="notice info">
              You need an available book to offer.{' '}
              <Link to="/my-books/new">Add a Book</Link>
            </p>
          ) : null}
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
          <article className="card">
            <h3>You are offering</h3>
            <p>{offered?.title}</p>
            <p>{offered?.author}</p>
            <p>{formatCondition(offered?.condition)} condition</p>
          </article>
          <article className="card">
            <h3>In exchange for</h3>
            <p>{requested.title}</p>
            <p>{requested.author}</p>
            <p>{formatCondition(requested.condition)} condition</p>
          </article>
          <p>
            To: <strong>{requested.owner.name}</strong>
          </p>
          <p>This proposal cannot be changed after submission.</p>
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
