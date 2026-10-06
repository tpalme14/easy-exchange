import BookCard from './BookCard.jsx';

export default function BookList({ books, showStatus = false, showOwner = true }) {
  return (
    <div className="card-grid">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          showStatus={showStatus}
          showOwner={showOwner}
        />
      ))}
    </div>
  );
}
