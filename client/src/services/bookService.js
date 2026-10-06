import { request } from './api.js';

export function getBooks({ title, author, q } = {}) {
  const params = new URLSearchParams();

  if (q) {
    params.set('q', q);
  }

  if (title) {
    params.set('title', title);
  }

  if (author) {
    params.set('author', author);
  }

  const query = params.toString();
  return request(`/books${query ? `?${query}` : ''}`);
}

export function getBook(id) {
  return request(`/books/${id}`);
}

export function createBook(payload) {
  return request('/books', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateBook(id, payload) {
  return request(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteBook(id) {
  return request(`/books/${id}`, { method: 'DELETE' });
}

export function getMyBooks() {
  return request('/users/me/books');
}
