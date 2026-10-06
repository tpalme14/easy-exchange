import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ExchangeCard from '../components/ExchangeCard.jsx';
import ConfirmationDialog from '../components/ConfirmationDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';
import {
  acceptExchange,
  cancelExchange,
  getReceivedExchanges,
  getSentExchanges,
  rejectExchange
} from '../services/exchangeService.js';
import { getErrorMessage } from '../utils/errors.js';

export default function MyExchangesPage() {
  const location = useLocation();
  const [tab, setTab] = useState('received');
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [sentData, receivedData] = await Promise.all([
        getSentExchanges(),
        getReceivedExchanges()
      ]);
      setSent(sentData.exchanges || []);
      setReceived(receivedData.exchanges || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load exchanges.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runAction() {
    setBusyId(confirm.exchange.id);
    setError('');
    try {
      if (confirm.action === 'accept') {
        await acceptExchange(confirm.exchange.id);
        setMessage('Exchange accepted.');
      } else if (confirm.action === 'reject') {
        await rejectExchange(confirm.exchange.id);
        setMessage('Exchange rejected.');
      } else {
        await cancelExchange(confirm.exchange.id);
        setMessage('Exchange cancelled.');
      }
      setConfirm(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update this exchange.'));
    } finally {
      setBusyId(null);
    }
  }

  const list = tab === 'received' ? received : sent;

  return (
    <section>
      <h2>My Exchanges</h2>
      {message ? <p className="notice success">{message}</p> : null}
      {confirm ? null : <ErrorMessage message={error} />}
      <div className="tabs" role="tablist" aria-label="Exchange lists">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'received'}
          onClick={() => setTab('received')}
        >
          Received
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'sent'}
          onClick={() => setTab('sent')}
        >
          Sent
        </button>
      </div>
      {loading ? <LoadingIndicator label="Loading exchanges..." /> : null}
      {!loading && list.length === 0 ? (
        <EmptyState
          message={
            tab === 'received'
              ? "You don't have any incoming exchange requests."
              : "You haven't proposed any exchanges yet."
          }
          action={
            tab === 'sent' ? (
              <Link className="button" to="/">
                Browse Books
              </Link>
            ) : null
          }
        />
      ) : null}
      <div className="stack">
        {list.map((exchange) => (
          <ExchangeCard
            key={exchange.id}
            exchange={exchange}
            perspective={tab}
            busy={busyId === exchange.id}
            onAccept={() => setConfirm({ action: 'accept', exchange })}
            onReject={() => setConfirm({ action: 'reject', exchange })}
            onCancel={() => setConfirm({ action: 'cancel', exchange })}
          />
        ))}
      </div>
      {confirm ? (
        <ConfirmationDialog
          title={
            confirm.action === 'accept'
              ? 'Accept Exchange?'
              : confirm.action === 'reject'
                ? 'Reject Exchange?'
                : 'Cancel Exchange?'
          }
          message={
            confirm.action === 'accept'
              ? `Accept the proposal for "${confirm.exchange.requestedBook.title}"? Both books will be marked as exchanged.`
              : confirm.action === 'reject'
                ? `Reject the proposal for "${confirm.exchange.requestedBook.title}"?`
                : `Cancel your proposal for "${confirm.exchange.requestedBook.title}"?`
          }
          confirmLabel={
            confirm.action === 'accept'
              ? 'Accept Exchange'
              : confirm.action === 'reject'
                ? 'Reject Exchange'
                : 'Cancel Exchange'
          }
          danger={confirm.action !== 'accept'}
          busy={Boolean(busyId)}
          error={error}
          onCancel={() => setConfirm(null)}
          onConfirm={runAction}
        />
      ) : null}
    </section>
  );
}
