import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage, isEmail } from '../utils/errors.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await login({ email, password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to log in.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <h2>Login</h2>
      <p className="muted">Easy Exchange</p>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <ErrorMessage message={error} />
        <label>
          Email <span className="required">(required)</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password <span className="required">(required)</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Need an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
