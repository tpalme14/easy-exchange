import { Link } from 'react-router-dom';
import { formatBookStatus, formatCondition } from '../utils/format.js';
import StatusBadge from './StatusBadge.jsx';

export default function BookCard({ book, showStatus = false, showOwner = true }) {
  return (
    <article className="card book-card">
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      <p>
        <StatusBadge type="Condition" value={formatCondition(book.condition)} />
      </p>
      {showOwner && book.owner ? <p>Owner: {book.owner.name}</p> : null}
      {showStatus ? (
        <p>
          <StatusBadge type="Status" value={formatBookStatus(book.status)} />
        </p>
      ) : null}
      <p>
        <Link to={`/books/${book.id}`}>View Details</Link>
      </p>
    </article>
  );
}
