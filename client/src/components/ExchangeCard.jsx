import {
  formatBookStatus,
  formatCondition,
  formatDate,
  formatExchangeStatus
} from '../utils/format.js';
import BookCover from './BookCover.jsx';
import StatusBadge from './StatusBadge.jsx';

function ExchangeBook({ label, book }) {
  return (
    <div className="exchange-book">
      <BookCover title={book.title} author={book.author} size="sm" />
      <div>
        <p className="eyebrow">{label}</p>
        <p className="exchange-book-title">{book.title}</p>
        <p className="muted small-text">
          {formatCondition(book.condition)} · {formatBookStatus(book.status)}
        </p>
      </div>
    </div>
  );
}

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
      <div className="exchange-card-header">
        <div>
          <h3>
            {perspective === 'received'
              ? `${otherUser.name} wants your "${exchange.requestedBook.title}"`
              : `You requested "${exchange.requestedBook.title}"`}
          </h3>
          <p className="exchange-lede">
            {perspective === 'received'
              ? `${otherUser.name} offers "${exchange.offeredBook.title}"`
              : `You offered "${exchange.offeredBook.title}"`}
          </p>
        </div>
        <div className="exchange-card-status">
          <StatusBadge type="Status" value={formatExchangeStatus(exchange.status)} />
          <p className="muted small-text">{formatDate(exchange.created_at)}</p>
        </div>
      </div>
      <div className="exchange-books">
        <ExchangeBook label="Offered" book={exchange.offeredBook} />
        <span className="exchange-arrow" aria-hidden="true">
          ⇄
        </span>
        <ExchangeBook label="Requested" book={exchange.requestedBook} />
      </div>
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
            className="danger-outline"
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
            className="danger-outline"
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
