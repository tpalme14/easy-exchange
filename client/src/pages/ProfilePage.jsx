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
      <div className="page-header">
        <h2>Profile</h2>
      </div>
      {loading ? <LoadingIndicator label="Loading profile..." /> : null}
      <ErrorMessage message={error} />
      {message ? <p className="notice success">{message}</p> : null}
      <div className="profile-layout">
        <div className="card profile-summary">
          <div className="profile-identity">
            <span className="avatar" aria-hidden="true">
              {(user?.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="profile-name">{user?.name}</p>
              <p className="muted">
                <span className="sr-only">Email: </span>
                {user?.email}
              </p>
            </div>
          </div>
          <dl className="stat-list">
            <div>
              <dt>Listed books</dt>
              <dd>{bookCount}</dd>
            </div>
            <div>
              <dt>Active exchanges</dt>
              <dd>{activeExchanges}</dd>
            </div>
          </dl>
        </div>
        <form className="form card" onSubmit={handleSubmit}>
          <h3>Display name</h3>
          <p className="muted small-text">This is how other readers see you on listings and proposals.</p>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <div className="button-row">
            <button type="submit" disabled={busy || !name.trim()}>
              {busy ? 'Saving...' : 'Save name'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
