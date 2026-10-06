import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingIndicator from './LoadingIndicator.jsx';

export default function AppLayout() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/login');
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <h1 className="app-title">
          <NavLink to={isAuthenticated ? '/' : '/login'} onClick={() => setMenuOpen(false)}>
            Easy Exchange
          </NavLink>
        </h1>
        <button
          type="button"
          className="menu-toggle secondary"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
        <nav
          id="main-navigation"
          className={`app-nav${menuOpen ? ' open' : ''}`}
          aria-label="Main"
        >
          {isAuthenticated ? (
            <>
              <NavLink to="/" end onClick={() => setMenuOpen(false)}>
                Browse Books
              </NavLink>
              <NavLink to="/my-books" onClick={() => setMenuOpen(false)}>
                My Books
              </NavLink>
              <NavLink to="/exchanges" onClick={() => setMenuOpen(false)}>
                My Exchanges
              </NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
                Profile
              </NavLink>
              <button type="button" className="linkish" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main id="main-content">
        {isLoading ? <LoadingIndicator label="Checking your session..." /> : <Outlet />}
      </main>
    </>
  );
}
