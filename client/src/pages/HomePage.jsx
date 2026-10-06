import { useEffect, useState } from 'react';
import { getBooks } from '../services/bookService.js';
import { getErrorMessage } from '../utils/errors.js';
import BookList from '../components/BookList.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getBooks(submitted ? { q: submitted } : {});
        if (!cancelled) {
          setBooks(data.books || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load available books.'));
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
  }, [submitted]);

  function handleSearch(event) {
    event.preventDefault();
    setSubmitted(query.trim());
  }

  return (
    <section>
      <div className="page-header">
        <h2>Available Books</h2>
      </div>
      <form className="search-form" onSubmit={handleSearch}>
        <label className="muted" htmlFor="book-search">
          Search title or author
        </label>
        <input
          id="book-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or author..."
        />
        <button type="submit">Search</button>
      </form>
      {loading ? <LoadingIndicator label="Loading books..." /> : null}
      <ErrorMessage message={error} />
      {!loading && !error && books.length === 0 ? (
        <EmptyState message="There are currently no books available for exchange." />
      ) : null}
      {!loading && books.length > 0 ? <BookList books={books} /> : null}
    </section>
  );
}
