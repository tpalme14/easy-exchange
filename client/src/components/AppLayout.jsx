import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingIndicator from './LoadingIndicator.jsx';

function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor" />
      <path
        d="M9 10.5c2.4-.9 4.8-.7 7 .8v11c-2.2-1.5-4.6-1.7-7-.8v-11Zm14 0c-2.4-.9-4.8-.7-7 .8v11c2.2-1.5 4.6-1.7 7-.8v-11Z"
        fill="none"
        stroke="#fbf7ef"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">
            <NavLink to={isAuthenticated ? '/' : '/login'} onClick={() => setMenuOpen(false)}>
              <BrandMark />
              <span className="brand-name">Easy Exchange</span>
            </NavLink>
          </h1>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d={menuOpen ? 'M5 5l10 10M15 5L5 15' : 'M3 6h14M3 10h14M3 14h14'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
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
                <button type="button" className="nav-logout" onClick={handleLogout}>
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
        </div>
      </header>
      <main id="main-content">
        {isLoading ? <LoadingIndicator label="Checking your session..." /> : <Outlet />}
      </main>
      <footer className="app-footer">
        <p>Easy Exchange · Pass along the books you&apos;ve finished, discover the ones you haven&apos;t.</p>
      </footer>
    </div>
  );
}
