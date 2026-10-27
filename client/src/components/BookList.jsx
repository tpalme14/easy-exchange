import BookCard from './BookCard.jsx';

export default function BookList({
  books,
  showStatus = false,
  showOwner = true,
  showPropose = false
}) {
  return (
    <div className="card-grid book-grid">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          showStatus={showStatus}
          showOwner={showOwner}
          showPropose={showPropose}
        />
      ))}
    </div>
  );
}
