import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookForm from '../components/BookForm.jsx';
import { createBook, updateBook } from '../services/bookService.js';
import { getErrorMessage } from '../utils/errors.js';

const emptyBook = {
  title: '',
  author: '',
  description: '',
  condition: '',
  status: 'AVAILABLE'
};

export default function AddBookPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(emptyBook);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setBusy(true);
    setError('');
    try {
      const created = await createBook({
        title: values.title,
        author: values.author,
        description: values.description,
        condition: values.condition
      });
      if (values.status === 'UNAVAILABLE') {
        await updateBook(created.book.id, { status: 'UNAVAILABLE' });
      }
      navigate('/my-books', { replace: true, state: { message: 'Book added successfully.' } });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to add this book.'));
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Add Book</h2>
      <BookForm
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/my-books')}
        submitLabel="Save"
        busy={busy}
        error={error}
      />
    </section>
  );
}
