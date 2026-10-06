import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { getMyBooks } from '../services/bookService.js';
import { getReceivedExchanges, getSentExchanges } from '../services/exchangeService.js';
import { updateMyProfile } from '../services/userService.js';
import { getErrorMessage } from '../utils/errors.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bookCount, setBookCount] = useState(0);
  const [activeExchanges, setActiveExchanges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [books, sent, received] = await Promise.all([
          getMyBooks(),
          getSentExchanges(),
          getReceivedExchanges()
        ]);
        if (cancelled) {
          return;
        }
        const pending = [...(sent.exchanges || []), ...(received.exchanges || [])].filter(
          (exchange) => exchange.status === 'PENDING'
        );
        setBookCount((books.books || []).length);
        setActiveExchanges(pending.length);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load your profile.'));
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
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await updateMyProfile({ name });
      setUser(data.user);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update your name.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Profile</h2>
      {loading ? <LoadingIndicator label="Loading profile..." /> : null}
      <ErrorMessage message={error} />
      {message ? <p className="notice success">{message}</p> : null}
      <div className="card stack">
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Listed books:</strong> {bookCount}
        </p>
        <p>
          <strong>Active exchanges:</strong> {activeExchanges}
        </p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <button type="submit" disabled={busy || !name.trim()}>
          {busy ? 'Saving...' : 'Save name'}
        </button>
      </form>
    </section>
  );
}
