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

  function clearSearch() {
    setQuery('');
    setSubmitted('');
  }

  const countLabel = `${books.length} ${books.length === 1 ? 'book' : 'books'}`;

  return (
    <section>
      <div className="hero">
        <p className="eyebrow">The community shelf</p>
        <h2 className="hero-title">Available Books</h2>
        <p className="hero-lead">
          Trade a book you&apos;ve finished for one you haven&apos;t read yet. Every title here
          is offered by a fellow reader, one copy for one copy.
        </p>
        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label className="search-label" htmlFor="book-search">
            Search title or author
          </label>
          <div className="search-field">
            <svg
              className="search-icon"
              viewBox="0 0 20 20"
              width="18"
              height="18"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="m13.2 13.2 3.8 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              id="book-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title or author..."
            />
            <button type="submit">Search</button>
          </div>
        </form>
      </div>
      {loading ? <LoadingIndicator label="Loading books..." /> : null}
      <ErrorMessage message={error} />
      {!loading && !error && books.length > 0 ? (
        <div className="results-bar">
          <p className="results-meta" aria-live="polite">
            {submitted ? (
              <>
                {countLabel} matching <strong>&ldquo;{submitted}&rdquo;</strong>
              </>
            ) : (
              `${countLabel} on the shelf`
            )}
          </p>
          {submitted ? (
            <button type="button" className="ghost small" onClick={clearSearch}>
              Clear search
            </button>
          ) : null}
        </div>
      ) : null}
      {!loading && !error && books.length === 0 && submitted ? (
        <EmptyState
          title="No matches found"
          message={`No available books match "${submitted}". Try a different title or author.`}
          action={
            <button type="button" className="secondary" onClick={clearSearch}>
              Clear search
            </button>
          }
        />
      ) : null}
      {!loading && !error && books.length === 0 && !submitted ? (
        <EmptyState
          title="The shelf is empty for now"
          message="There are currently no books available for exchange."
        />
      ) : null}
      {!loading && books.length > 0 ? <BookList books={books} showStatus showPropose /> : null}
    </section>
  );
}
