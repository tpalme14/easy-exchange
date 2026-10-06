import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from './app.js';
import { closeDb, initializeDatabase } from './db/connection.js';
import { findBookById } from './db/books.js';
import { findExchangeById } from './db/exchanges.js';
import { run } from './db/query.js';

const password = 'password123';

function createAgent() {
  return request.agent(app);
}

async function register(agent, { name, email }) {
  const response = await agent.post('/api/auth/register').send({
    name,
    email,
    password
  });
  expect(response.status).toBe(201);
  return response.body.user;
}

function bookPayload(overrides = {}) {
  return {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    condition: 'GOOD',
    description: 'A well-loved copy.',
    ...overrides
  };
}

async function createBook(agent, overrides = {}) {
  return agent.post('/api/books').send(bookPayload(overrides));
}

function expectPublicBook(body) {
  expect(body.password).toBeUndefined();
  expect(body.password_hash).toBeUndefined();
  expect(body.owner.email).toBeUndefined();
  expect(body.owner.password_hash).toBeUndefined();
  expect(body.owner).toEqual({
    id: expect.any(Number),
    name: expect.any(String)
  });
}

describe('book management', () => {
  beforeEach(() => {
    initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDb();
  });

  describe('POST /api/books', () => {
    it('creates a book owned by the authenticated user with AVAILABLE status', async () => {
      const agent = createAgent();
      const user = await register(agent, { name: 'Alex', email: 'alex@example.com' });
      const response = await createBook(agent, {
        owner_id: 999,
        status: 'UNAVAILABLE'
      });

      expect(response.status).toBe(201);
      expect(response.body.book).toMatchObject({
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        condition: 'GOOD',
        description: 'A well-loved copy.',
        status: 'AVAILABLE',
        owner: { id: user.id, name: 'Alex' }
      });
      expectPublicBook(response.body.book);
      expect(JSON.stringify(response.body)).not.toMatch(/password/i);

      const stored = findBookById(response.body.book.id);
      expect(Number(stored.owner_id)).toBe(user.id);
      expect(stored.status).toBe('AVAILABLE');
    });

    it('rejects unauthenticated create requests', async () => {
      const response = await createBook(createAgent());

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('rejects missing fields and invalid conditions', async () => {
      const agent = createAgent();
      await register(agent, { name: 'Alex', email: 'alex@example.com' });

      const missing = await agent.post('/api/books').send({ title: 'Dune' });
      const invalid = await createBook(agent, { condition: 'EXCELLENT' });

      expect(missing.status).toBe(400);
      expect(missing.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalid.status).toBe(400);
      expect(invalid.body.error.code).toBe('INVALID_CONDITION');
    });
  });

  describe('GET /api/books and GET /api/books/:id', () => {
    it('returns an existing book and 404 for a missing book', async () => {
      const agent = createAgent();
      await register(agent, { name: 'Alex', email: 'alex@example.com' });
      const created = await createBook(agent);
      const found = await createAgent().get(`/api/books/${created.body.book.id}`);
      const missing = await createAgent().get('/api/books/999');

      expect(found.status).toBe(200);
      expect(found.body.book.title).toBe('The Hobbit');
      expectPublicBook(found.body.book);
      expect(missing.status).toBe(404);
      expect(missing.body.error.code).toBe('BOOK_NOT_FOUND');
    });

    it('lists available books and excludes the current user inventory', async () => {
      const alex = createAgent();
      const jordan = createAgent();
      await register(alex, { name: 'Alex', email: 'alex@example.com' });
      await register(jordan, { name: 'Jordan', email: 'jordan@example.com' });

      await createBook(alex, { title: 'The Hobbit' });
      await createBook(jordan, { title: 'Dune', author: 'Frank Herbert', condition: 'FAIR' });
      await alex.put(`/api/books/${(await createBook(alex, { title: 'Hidden' })).body.book.id}`).send({
        status: 'UNAVAILABLE'
      });

      const catalog = await jordan.get('/api/books');
      const titles = catalog.body.books.map((book) => book.title);

      expect(catalog.status).toBe(200);
      expect(titles).toContain('The Hobbit');
      expect(titles).not.toContain('Dune');
      expect(titles).not.toContain('Hidden');
    });

    it('searches available books by title or author, case-insensitively', async () => {
      const alex = createAgent();
      const jordan = createAgent();
      await register(alex, { name: 'Alex', email: 'alex@example.com' });
      await register(jordan, { name: 'Jordan', email: 'jordan@example.com' });
      await createBook(alex, { title: 'The Hobbit', author: 'J.R.R. Tolkien' });
      await createBook(alex, { title: 'Dune', author: 'Frank Herbert' });

      const byTitle = await jordan.get('/api/books').query({ title: 'hobbit' });
      const byAuthor = await jordan.get('/api/books').query({ author: 'herbert' });
      const either = await jordan.get('/api/books').query({ q: 'TOLKIEN' });

      expect(byTitle.body.books.map((book) => book.title)).toEqual(['The Hobbit']);
      expect(byAuthor.body.books.map((book) => book.title)).toEqual(['Dune']);
      expect(either.body.books.map((book) => book.title)).toEqual(['The Hobbit']);
    });
  });

  describe('GET /api/users/me/books', () => {
    it('returns the authenticated user books including unavailable titles', async () => {
      const agent = createAgent();
      await register(agent, { name: 'Alex', email: 'alex@example.com' });
      const available = await createBook(agent, { title: 'The Hobbit' });
      const hidden = await createBook(agent, { title: 'Private Notes' });
      await agent.put(`/api/books/${hidden.body.book.id}`).send({ status: 'UNAVAILABLE' });

      const response = await agent.get('/api/users/me/books');
      const titles = response.body.books.map((book) => book.title);

      expect(response.status).toBe(200);
      expect(titles).toEqual(expect.arrayContaining(['The Hobbit', 'Private Notes']));
      expect(response.body.books.find((book) => book.id === available.body.book.id).status).toBe(
        'AVAILABLE'
      );
      expect(response.body.books.find((book) => book.id === hidden.body.book.id).status).toBe(
        'UNAVAILABLE'
      );
    });

    it('rejects unauthenticated requests', async () => {
      const response = await createAgent().get('/api/users/me/books');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('PUT /api/books/:id', () => {
    it('lets the owner update an eligible book', async () => {
      const agent = createAgent();
      await register(agent, { name: 'Alex', email: 'alex@example.com' });
      const created = await createBook(agent);
      const response = await agent.put(`/api/books/${created.body.book.id}`).send({
        title: 'The Hobbit Illustrated',
        author: 'J.R.R. Tolkien',
        description: 'Updated notes.',
        condition: 'LIKE_NEW',
        status: 'UNAVAILABLE',
        owner_id: 999
      });

      expect(response.status).toBe(200);
      expect(response.body.book).toMatchObject({
        title: 'The Hobbit Illustrated',
        condition: 'LIKE_NEW',
        status: 'UNAVAILABLE',
        owner: { name: 'Alex' }
      });
      expect(response.body.book.owner.id).not.toBe(999);
    });

    it('prevents other users and unauthenticated clients from updating a book', async () => {
      const owner = createAgent();
      const other = createAgent();
      await register(owner, { name: 'Alex', email: 'alex@example.com' });
      await register(other, { name: 'Jordan', email: 'jordan@example.com' });
      const created = await createBook(owner);

      const forbidden = await other.put(`/api/books/${created.body.book.id}`).send({
        title: 'Stolen Title'
      });
      const unauthenticated = await createAgent()
        .put(`/api/books/${created.body.book.id}`)
        .send({ title: 'No Auth' });

      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error.code).toBe('FORBIDDEN');
      expect(unauthenticated.status).toBe(401);
    });

    it('rejects invalid updates and exchanged books', async () => {
      const agent = createAgent();
      const user = await register(agent, { name: 'Alex', email: 'alex@example.com' });
      const created = await createBook(agent);
      const invalid = await agent.put(`/api/books/${created.body.book.id}`).send({
        condition: 'MINT'
      });

      run(
        `UPDATE books SET status = 'EXCHANGED' WHERE id = ?`,
        [created.body.book.id]
      );
      const exchanged = await agent.put(`/api/books/${created.body.book.id}`).send({
        title: 'Should fail'
      });

      expect(invalid.status).toBe(400);
      expect(exchanged.status).toBe(409);
      expect(exchanged.body.error.code).toBe('BOOK_EXCHANGED');
      expect(Number(findBookById(created.body.book.id).owner_id)).toBe(user.id);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('lets the owner delete an eligible book', async () => {
      const agent = createAgent();
      await register(agent, { name: 'Alex', email: 'alex@example.com' });
      const created = await createBook(agent);
      const response = await agent.delete(`/api/books/${created.body.book.id}`);
      const missing = await agent.get(`/api/books/${created.body.book.id}`);

      expect(response.status).toBe(200);
      expect(missing.status).toBe(404);
    });

    it('prevents other users and unauthenticated clients from deleting a book', async () => {
      const owner = createAgent();
      const other = createAgent();
      await register(owner, { name: 'Alex', email: 'alex@example.com' });
      await register(other, { name: 'Jordan', email: 'jordan@example.com' });
      const created = await createBook(owner);

      const forbidden = await other.delete(`/api/books/${created.body.book.id}`);
      const unauthenticated = await createAgent().delete(
        `/api/books/${created.body.book.id}`
      );

      expect(forbidden.status).toBe(403);
      expect(unauthenticated.status).toBe(401);
      expect(findBookById(created.body.book.id)).toBeTruthy();
    });

    it('cannot delete an exchanged book', async () => {
      const agent = createAgent();
      await register(agent, { name: 'Alex', email: 'alex@example.com' });
      const created = await createBook(agent);
      run(`UPDATE books SET status = 'EXCHANGED' WHERE id = ?`, [created.body.book.id]);

      const response = await agent.delete(`/api/books/${created.body.book.id}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('BOOK_EXCHANGED');
      expect(findBookById(created.body.book.id).status).toBe('EXCHANGED');
    });

    it('cannot delete a book referenced by an exchange', async () => {
      const owner = createAgent();
      const requester = createAgent();
      await register(owner, { name: 'Alex', email: 'alex-owner@example.com' });
      await register(requester, { name: 'Jordan', email: 'jordan-req@example.com' });
      const requested = await createBook(owner, { title: 'Requested Book' });
      const offered = await createBook(requester, { title: 'Offered Book' });
      const proposal = await requester.post('/api/exchanges').send({
        offered_book_id: offered.body.book.id,
        requested_book_id: requested.body.book.id
      });

      expect(proposal.status).toBe(201);

      const response = await owner.delete(`/api/books/${requested.body.book.id}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('BOOK_IN_EXCHANGE');
      expect(findBookById(requested.body.book.id)).toBeTruthy();
      expect(findBookById(offered.body.book.id)).toBeTruthy();
      expect(findExchangeById(proposal.body.exchange.id)).toMatchObject({
        status: 'PENDING',
        offered_book_id: offered.body.book.id,
        requested_book_id: requested.body.book.id
      });
    });
  });
});
