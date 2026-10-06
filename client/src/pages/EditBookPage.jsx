import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BookForm from '../components/BookForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingIndicator from '../components/LoadingIndicator.jsx';
import { getBook, updateBook } from '../services/bookService.js';
import { getErrorMessage } from '../utils/errors.js';

export default function EditBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getBook(id);
        if (cancelled) {
          return;
        }
        if (data.book.status === 'EXCHANGED') {
          setError('Books involved in an accepted exchange cannot be edited.');
          setValues(null);
        } else {
          setValues({
            title: data.book.title,
            author: data.book.author,
            description: data.book.description || '',
            condition: data.book.condition,
            status: data.book.status
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load this book.'));
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
  }, [id]);

  async function handleSubmit() {
    setBusy(true);
    setError('');
    try {
      await updateBook(id, values);
      navigate(`/books/${id}`, {
        replace: true
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update this book.'));
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingIndicator label="Loading book..." />;
  }

  if (!values) {
    return (
      <section>
        <h2>Edit Book</h2>
        <ErrorMessage message={error} />
      </section>
    );
  }

  return (
    <section>
      <h2>Edit Book</h2>
      <BookForm
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/books/${id}`)}
        submitLabel="Save"
        busy={busy}
        error={error}
      />
    </section>
  );
}
