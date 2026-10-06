import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { getCurrentUser, loginUser, logoutUser, registerUser } from './services/authService.js';
import { notifyUnauthorized } from './services/api.js';
import { getBooks } from './services/bookService.js';

vi.mock('./services/authService.js');
vi.mock('./services/bookService.js');
vi.mock('./services/exchangeService.js');
vi.mock('./services/userService.js');

const user = { id: 1, name: 'Alex', email: 'alex@example.com' };

describe('App authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockRejectedValue(Object.assign(new Error('Please log in'), { status: 401 }));
    getBooks.mockResolvedValue({ books: [] });
  });

  it('shows login and register for unauthenticated users', async () => {
    render(<App />);

    expect(await screen.findByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Available Books' })).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users away from protected pages', async () => {
    window.history.pushState({}, '', '/my-books');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('logs in and shows the catalog', async () => {
    loginUser.mockResolvedValue({ user });
    getCurrentUser.mockRejectedValue(Object.assign(new Error('Please log in'), { status: 401 }));
    render(<App />);

    await screen.findByRole('heading', { name: 'Login' });
    await userEvent.type(screen.getByLabelText(/email/i), 'alex@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('heading', { name: 'Available Books' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('registers a new user', async () => {
    registerUser.mockResolvedValue({ user });
    render(<App />);

    await userEvent.click(await screen.findByRole('link', { name: 'Register' }));
    await userEvent.type(screen.getByLabelText(/^name/i), 'Alex');
    await userEvent.type(screen.getByLabelText(/email/i), 'alex@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(registerUser).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Available Books' })).toBeInTheDocument();
  });

  it('logs out and returns to login', async () => {
    getCurrentUser.mockResolvedValue({ user });
    logoutUser.mockResolvedValue({ message: 'Logged out.' });
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows login validation errors', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: 'Login' });
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/required/i);
  });

  it('returns to login when a later request reports an expired session', async () => {
    getCurrentUser.mockResolvedValue({ user });
    render(<App />);

    expect(await screen.findByRole('button', { name: 'Logout' })).toBeInTheDocument();
    notifyUnauthorized();
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });
});
