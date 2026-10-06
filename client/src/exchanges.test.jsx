import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from './context/authContext.js';
import ProposeExchangePage from './pages/ProposeExchangePage.jsx';
import MyExchangesPage from './pages/MyExchangesPage.jsx';
import { getBook, getMyBooks } from './services/bookService.js';
import {
  acceptExchange,
  createExchange,
  getReceivedExchanges,
  getSentExchanges
} from './services/exchangeService.js';

vi.mock('./services/bookService.js');
vi.mock('./services/exchangeService.js');

const authValue = {
  user: { id: 1, name: 'Alex', email: 'alex@example.com' },
  isAuthenticated: true,
  isLoading: false
};

const requested = {
  id: 10,
  title: 'Dune',
  author: 'Frank Herbert',
  condition: 'FAIR',
  status: 'AVAILABLE',
  owner: { id: 2, name: 'Jordan' }
};

const offered = {
  id: 3,
  title: 'The Hobbit',
  author: 'J.R.R. Tolkien',
  condition: 'GOOD',
  status: 'AVAILABLE',
  owner: { id: 1, name: 'Alex' }
};

function renderAt(ui, path) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/books/:id/propose" element={<ProposeExchangePage />} />
          <Route path="/exchanges" element={<MyExchangesPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('exchange UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires confirmation before submitting a proposal', async () => {
    getBook.mockResolvedValue({ book: requested });
    getMyBooks.mockResolvedValue({ books: [offered] });
    createExchange.mockResolvedValue({ exchange: { id: 8, status: 'PENDING' } });
    getSentExchanges.mockResolvedValue({ exchanges: [] });
    getReceivedExchanges.mockResolvedValue({ exchanges: [] });

    renderAt(<ProposeExchangePage />, '/books/10/propose');

    await userEvent.selectOptions(
      await screen.findByLabelText(/you offer/i),
      '3'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Review Exchange' }));
    expect(screen.getByRole('heading', { name: 'Confirm Exchange' })).toBeInTheDocument();
    expect(screen.getByText('The Hobbit')).toBeInTheDocument();
    expect(screen.getByText('J.R.R. Tolkien')).toBeInTheDocument();
    expect(screen.getByText('Good condition')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
    expect(screen.getByText('Fair condition')).toBeInTheDocument();
    expect(screen.getByText(/To:/)).toHaveTextContent('Jordan');
    expect(createExchange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Submit Exchange' }));
    await waitFor(() =>
      expect(createExchange).toHaveBeenCalledWith({
        offered_book_id: 3,
        requested_book_id: 10
      })
    );
  });

  it('shows completed status without actions', async () => {
    getSentExchanges.mockResolvedValue({
      exchanges: [
        {
          id: 4,
          status: 'ACCEPTED',
          created_at: '2026-01-01',
          requester: { id: 1, name: 'Alex' },
          offeredBook: { ...offered, status: 'EXCHANGED' },
          requestedBook: { ...requested, status: 'EXCHANGED' }
        }
      ]
    });
    getReceivedExchanges.mockResolvedValue({ exchanges: [] });
    renderAt(<MyExchangesPage />, '/exchanges');
    await userEvent.click(await screen.findByRole('tab', { name: 'Sent' }));
    expect(screen.getByText(/accepted/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('shows received and sent exchanges with appropriate actions', async () => {
    getSentExchanges.mockResolvedValue({
      exchanges: [
        {
          id: 1,
          status: 'PENDING',
          created_at: '2026-01-01',
          requester: { id: 1, name: 'Alex' },
          offeredBook: { ...offered, status: 'AVAILABLE' },
          requestedBook: { ...requested, status: 'AVAILABLE' }
        }
      ]
    });
    getReceivedExchanges.mockResolvedValue({
      exchanges: [
        {
          id: 2,
          status: 'PENDING',
          created_at: '2026-01-02',
          requester: { id: 3, name: 'Casey' },
          offeredBook: {
            id: 9,
            title: 'Neuromancer',
            condition: 'GOOD',
            status: 'AVAILABLE'
          },
          requestedBook: {
            id: 3,
            title: 'The Hobbit',
            condition: 'GOOD',
            status: 'AVAILABLE'
          }
        }
      ]
    });

    renderAt(<MyExchangesPage />, '/exchanges');
    expect(await screen.findByText(/Casey wants your "The Hobbit"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Sent' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('confirms accept and handles conflict errors', async () => {
    const pending = {
      id: 2,
      status: 'PENDING',
      created_at: '2026-01-02',
      requester: { id: 3, name: 'Casey' },
      offeredBook: { id: 9, title: 'Neuromancer', condition: 'GOOD', status: 'AVAILABLE' },
      requestedBook: { id: 3, title: 'The Hobbit', condition: 'GOOD', status: 'AVAILABLE' }
    };
    getSentExchanges.mockResolvedValue({ exchanges: [] });
    getReceivedExchanges.mockResolvedValue({ exchanges: [pending] });
    acceptExchange.mockRejectedValue(
      Object.assign(new Error('conflict'), { code: 'EXCHANGE_CONFLICT', status: 409 })
    );

    renderAt(<MyExchangesPage />, '/exchanges');
    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));
    await userEvent.click(screen.getByRole('button', { name: 'Accept Exchange' }));
    expect(
      await screen.findByText(/no longer available/i)
    ).toBeInTheDocument();
  });
});
