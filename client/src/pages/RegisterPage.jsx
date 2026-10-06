import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage, isEmail } from '../utils/errors.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!values.name.trim() || !values.email.trim() || !values.password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (!isEmail(values.email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (values.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create your account.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <h2>Register</h2>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <ErrorMessage message={error} />
        <label>
          Name <span className="required">(required)</span>
          <input name="name" value={values.name} onChange={handleChange} required />
        </label>
        <label>
          Email <span className="required">(required)</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password <span className="required">(required)</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Confirm password <span className="required">(required)</span>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
