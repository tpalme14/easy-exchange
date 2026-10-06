import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from './context/authContext.js';
import HomePage from './pages/HomePage.jsx';
import BookDetailsPage from './pages/BookDetailsPage.jsx';
import AddBookPage from './pages/AddBookPage.jsx';
import MyBooksPage from './pages/MyBooksPage.jsx';
import EditBookPage from './pages/EditBookPage.jsx';
import { createBook, getBook, getBooks, getMyBooks, updateBook } from './services/bookService.js';

vi.mock('./services/bookService.js');

const authValue = {
  user: { id: 1, name: 'Alex', email: 'alex@example.com' },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn()
};

function renderPage(ui, path = '/', routePath = path) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={ui} />
          <Route path="/my-books" element={<MyBooksPage />} />
          <Route path="/my-books/new" element={<AddBookPage />} />
          <Route path="/my-books/:id/edit" element={<EditBookPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('book pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty catalog state', async () => {
    getBooks.mockResolvedValue({ books: [] });
    renderPage(<HomePage />);
    expect(await screen.findByText(/no books available for exchange/i)).toBeInTheDocument();
  });

  it('shows a catalog error state', async () => {
    getBooks.mockRejectedValue(Object.assign(new Error('Unable to load'), { status: 500 }));
    renderPage(<HomePage />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('renders books and searches the catalog', async () => {
    getBooks.mockResolvedValue({
      books: [
        {
          id: 2,
          title: 'Dune',
          author: 'Frank Herbert',
          condition: 'FAIR',
          owner: { id: 9, name: 'Jordan' }
        }
      ]
    });
    renderPage(<HomePage />);
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/search title or author/i), 'dune');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(getBooks).toHaveBeenCalledWith({ q: 'dune' }));
  });

  it('shows propose exchange for another user available book', async () => {
    getBook.mockResolvedValue({
      book: {
        id: 4,
        title: 'Dune',
        author: 'Frank Herbert',
        description: 'Epic.',
        condition: 'FAIR',
        status: 'AVAILABLE',
        owner: { id: 9, name: 'Jordan' }
      }
    });
    renderPage(<BookDetailsPage />, '/books/4', '/books/:id');
    expect(await screen.findByRole('link', { name: 'Propose Exchange' })).toBeInTheDocument();
  });

  it('adds a book through the form', async () => {
    createBook.mockResolvedValue({
      book: { id: 3, title: 'The Hobbit', status: 'AVAILABLE' }
    });
    renderPage(<AddBookPage />, '/my-books/new', '/my-books/new');
    await userEvent.type(screen.getByLabelText(/title/i), 'The Hobbit');
    await userEvent.type(screen.getByLabelText(/author/i), 'J.R.R. Tolkien');
    await userEvent.selectOptions(screen.getByLabelText(/condition/i), 'GOOD');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(createBook).toHaveBeenCalled());
  });

  it('shows a catalog loading state', () => {
    getBooks.mockReturnValue(new Promise(() => {}));
    renderPage(<HomePage />);
    expect(screen.getByText(/loading books/i)).toBeInTheDocument();
  });

  it('loads a book for editing', async () => {
    getBook.mockResolvedValue({
      book: {
        id: 3,
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        description: 'Adventure.',
        condition: 'GOOD',
        status: 'AVAILABLE'
      }
    });
    updateBook.mockResolvedValue({
      book: { id: 3, title: 'The Hobbit', status: 'UNAVAILABLE' }
    });
    renderPage(<EditBookPage />, '/my-books/3/edit', '/my-books/:id/edit');
    expect(await screen.findByDisplayValue('The Hobbit')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/availability/i), 'UNAVAILABLE');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(updateBook).toHaveBeenCalled());
  });

  it('blocks editing of exchanged books', async () => {
    getBook.mockResolvedValue({
      book: {
        id: 5,
        title: 'Dune',
        author: 'Frank Herbert',
        description: '',
        condition: 'FAIR',
        status: 'EXCHANGED'
      }
    });
    renderPage(<EditBookPage />, '/my-books/5/edit', '/my-books/:id/edit');
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot be edited/i);
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('shows delete confirmation on my books', async () => {
    getMyBooks.mockResolvedValue({
      books: [
        {
          id: 3,
          title: 'The Hobbit',
          author: 'J.R.R. Tolkien',
          condition: 'GOOD',
          status: 'AVAILABLE'
        }
      ]
    });
    renderPage(<MyBooksPage />, '/my-books', '/my-books');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/delete "The Hobbit"/i);
  });
});
