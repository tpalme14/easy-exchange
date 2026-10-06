import {
  formatBookStatus,
  formatCondition,
  formatDate,
  formatExchangeStatus
} from '../utils/format.js';
import StatusBadge from './StatusBadge.jsx';

export default function ExchangeCard({
  exchange,
  perspective,
  onAccept,
  onReject,
  onCancel,
  busy = false
}) {
  const otherUser =
    perspective === 'received' ? exchange.requester : exchange.requestedBook.owner;
  const pending = exchange.status === 'PENDING';
  const blocked =
    pending &&
    (exchange.requestedBook.status !== 'AVAILABLE' ||
      exchange.offeredBook.status !== 'AVAILABLE');

  return (
    <article className="card exchange-card">
      <h3>
        {perspective === 'received'
          ? `${otherUser.name} wants your "${exchange.requestedBook.title}"`
          : `You requested "${exchange.requestedBook.title}"`}
      </h3>
      <p>
        {perspective === 'received'
          ? `${otherUser.name} offers "${exchange.offeredBook.title}"`
          : `You offered "${exchange.offeredBook.title}"`}
      </p>
      <p>
        <StatusBadge type="Status" value={formatExchangeStatus(exchange.status)} />
      </p>
      <p className="muted">{formatDate(exchange.created_at)}</p>
      <p>
        Offered: {exchange.offeredBook.title} · {formatCondition(exchange.offeredBook.condition)} ·{' '}
        {formatBookStatus(exchange.offeredBook.status)}
      </p>
      <p>
        Requested: {exchange.requestedBook.title} · {formatCondition(exchange.requestedBook.condition)} ·{' '}
        {formatBookStatus(exchange.requestedBook.status)}
      </p>
      {blocked ? (
        <p className="notice info" role="status">
          This proposal can no longer be completed because one of the books is no longer
          available.
        </p>
      ) : null}
      {pending && perspective === 'received' ? (
        <div className="button-row">
          <button type="button" onClick={onAccept} disabled={busy || blocked}>
            Accept
          </button>
          <button
            type="button"
            className="danger"
            onClick={onReject}
            disabled={busy}
          >
            Reject
          </button>
        </div>
      ) : null}
      {pending && perspective === 'sent' ? (
        <div className="button-row">
          <button
            type="button"
            className="danger"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      ) : null}
    </article>
  );
}
