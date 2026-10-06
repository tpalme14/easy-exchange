import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import BookDetailsPage from './pages/BookDetailsPage.jsx';
import MyBooksPage from './pages/MyBooksPage.jsx';
import AddBookPage from './pages/AddBookPage.jsx';
import EditBookPage from './pages/EditBookPage.jsx';
import ProposeExchangePage from './pages/ProposeExchangePage.jsx';
import MyExchangesPage from './pages/MyExchangesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/books/:id" element={<BookDetailsPage />} />
              <Route path="/books/:id/propose" element={<ProposeExchangePage />} />
              <Route path="/my-books" element={<MyBooksPage />} />
              <Route path="/my-books/new" element={<AddBookPage />} />
              <Route path="/my-books/:id/edit" element={<EditBookPage />} />
              <Route path="/exchanges" element={<MyExchangesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/books/new" element={<Navigate to="/my-books/new" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
