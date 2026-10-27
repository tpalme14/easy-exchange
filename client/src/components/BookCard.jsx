import { useId } from 'react';
import { Link } from 'react-router-dom';
import { formatBookStatus, formatCondition } from '../utils/format.js';
import BookCover from './BookCover.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function BookCard({
  book,
  showStatus = false,
  showOwner = true,
  showPropose = false,
  actions = null
}) {
  const titleId = useId();
  const canPropose = showPropose && book.status === 'AVAILABLE';

  return (
    <article className="card book-card">
      <div className="book-card-media">
        <BookCover title={book.title} author={book.author} />
      </div>
      <div className="book-card-body">
        <h3 id={titleId} className="book-card-title">
          {book.title}
        </h3>
        <p className="book-card-author">{book.author}</p>
        <div className="badge-row">
          <StatusBadge type="Condition" value={formatCondition(book.condition)} />
          {showStatus && book.status ? (
            <StatusBadge type="Status" value={formatBookStatus(book.status)} />
          ) : null}
        </div>
        {showOwner && book.owner ? (
          <p className="book-card-owner">
            <span className="muted">Offered by</span> {book.owner.name}
          </p>
        ) : null}
        <div className="book-card-actions">
          {actions || (
            <>
              <Link
                className="button secondary small"
                to={`/books/${book.id}`}
                aria-describedby={titleId}
              >
                View Details
              </Link>
              {canPropose ? (
                <Link
                  className="button small"
                  to={`/books/${book.id}/propose`}
                  aria-describedby={titleId}
                >
                  Propose Exchange
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
