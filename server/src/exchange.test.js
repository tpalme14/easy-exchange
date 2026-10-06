import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from './app.js';
import { findBookById } from './db/books.js';
import { closeDb, initializeDatabase } from './db/connection.js';
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

async function createBook(agent, overrides = {}) {
  const response = await agent.post('/api/books').send({
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    condition: 'GOOD',
    ...overrides
  });
  expect(response.status).toBe(201);
  return response.body.book;
}

async function propose(agent, offeredBookId, requestedBookId, extra = {}) {
  return agent.post('/api/exchanges').send({
    offered_book_id: offeredBookId,
    requested_book_id: requestedBookId,
    ...extra
  });
}

describe('exchanges', () => {
  let alex;
  let jordan;
  let casey;
  let alexUser;
  let jordanUser;
  let caseyUser;
  let alexBook;
  let jordanBook;
  let caseyBook;

  beforeEach(async () => {
    initializeDatabase(':memory:');
    alex = createAgent();
    jordan = createAgent();
    casey = createAgent();
    alexUser = await register(alex, { name: 'Alex', email: 'alex@example.com' });
    jordanUser = await register(jordan, { name: 'Jordan', email: 'jordan@example.com' });
    caseyUser = await register(casey, { name: 'Casey', email: 'casey@example.com' });
    alexBook = await createBook(alex, { title: 'Book A' });
    jordanBook = await createBook(jordan, { title: 'Book B' });
    caseyBook = await createBook(casey, { title: 'Book C' });
  });

  afterEach(() => {
    closeDb();
  });

  describe('POST /api/exchanges', () => {
    it('creates a pending proposal from the authenticated requester', async () => {
      const response = await propose(jordan, jordanBook.id, alexBook.id, {
        requester_id: alexUser.id
      });

      expect(response.status).toBe(201);
      expect(response.body.exchange).toMatchObject({
        status: 'PENDING',
        requester: { id: jordanUser.id, name: 'Jordan' },
        offeredBook: { id: jordanBook.id, title: 'Book B' },
        requestedBook: { id: alexBook.id, title: 'Book A' }
      });
      expect(response.body.exchange.requester.id).not.toBe(alexUser.id);
      expect(JSON.stringify(response.body)).not.toMatch(/password/i);
    });

    it('rejects unauthenticated proposals', async () => {
      const response = await propose(createAgent(), jordanBook.id, alexBook.id);

      expect(response.status).toBe(401);
    });

    it('rejects proposals that break ownership or availability rules', async () => {
      await jordan.put(`/api/books/${jordanBook.id}`).send({ status: 'UNAVAILABLE' });
      const notOwner = await propose(jordan, alexBook.id, caseyBook.id);
      const offeredUnavailable = await propose(jordan, jordanBook.id, alexBook.id);

      await jordan.put(`/api/books/${jordanBook.id}`).send({ status: 'AVAILABLE' });
      await alex.put(`/api/books/${alexBook.id}`).send({ status: 'UNAVAILABLE' });
      const requestedUnavailable = await propose(jordan, jordanBook.id, alexBook.id);
      const missingBook = await propose(jordan, jordanBook.id, 999);
      const ownBook = await propose(jordan, jordanBook.id, jordanBook.id);
      const selfExchange = await propose(
        jordan,
        jordanBook.id,
        (await createBook(jordan, { title: 'Jordan Extra' })).id
      );

      expect(notOwner.status).toBe(403);
      expect(offeredUnavailable.status).toBe(409);
      expect(requestedUnavailable.status).toBe(409);
      expect(missingBook.status).toBe(404);
      expect(ownBook.status).toBe(400);
      expect(selfExchange.status).toBe(400);
    });

    it('rejects duplicate pending proposals for the same two books', async () => {
      const first = await propose(jordan, jordanBook.id, alexBook.id);
      const duplicate = await propose(jordan, jordanBook.id, alexBook.id);

      expect(first.status).toBe(201);
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error.code).toBe('DUPLICATE_EXCHANGE');
    });

    it('allows a new pending proposal after the previous one is cancelled or rejected', async () => {
      const cancelled = await propose(jordan, jordanBook.id, alexBook.id);
      await jordan.post(`/api/exchanges/${cancelled.body.exchange.id}/cancel`);
      const afterCancel = await propose(jordan, jordanBook.id, alexBook.id);

      expect(cancelled.status).toBe(201);
      expect(afterCancel.status).toBe(201);

      await alex.post(`/api/exchanges/${afterCancel.body.exchange.id}/reject`);
      const afterReject = await propose(jordan, jordanBook.id, alexBook.id);

      expect(afterReject.status).toBe(201);
    });

    it('rejects a second concurrent pending proposal for the same books', async () => {
      const [first, second] = await Promise.all([
        propose(jordan, jordanBook.id, alexBook.id),
        propose(jordan, jordanBook.id, alexBook.id)
      ]);
      const statuses = [first.status, second.status].sort();

      expect(statuses).toEqual([201, 409]);
      expect([first.body.error?.code, second.body.error?.code]).toContain('DUPLICATE_EXCHANGE');
    });
  });

  describe('viewing exchanges', () => {
    it('returns sent and received exchanges for the authorized user', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      const sent = await jordan.get('/api/exchanges/sent');
      const received = await alex.get('/api/exchanges/received');
      const details = await alex.get(`/api/exchanges/${created.body.exchange.id}`);

      expect(sent.body.exchanges).toHaveLength(1);
      expect(received.body.exchanges).toHaveLength(1);
      expect(details.status).toBe(200);
      expect(details.body.exchange.id).toBe(created.body.exchange.id);
    });

    it('rejects unauthenticated and non-participant access', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      const unauthenticated = await createAgent().get('/api/exchanges/sent');
      const outsider = await casey.get(`/api/exchanges/${created.body.exchange.id}`);
      const missing = await alex.get('/api/exchanges/999');

      expect(unauthenticated.status).toBe(401);
      expect(outsider.status).toBe(403);
      expect(missing.status).toBe(404);
    });
  });

  describe('POST /api/exchanges/:id/accept', () => {
    it('accepts a pending exchange and marks both books exchanged', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      const response = await alex.post(`/api/exchanges/${created.body.exchange.id}/accept`);

      expect(response.status).toBe(200);
      expect(response.body.exchange.status).toBe('ACCEPTED');
      expect(findBookById(alexBook.id).status).toBe('EXCHANGED');
      expect(findBookById(jordanBook.id).status).toBe('EXCHANGED');
    });

    it('only allows the requested-book owner to accept a pending exchange', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      const requester = await jordan.post(
        `/api/exchanges/${created.body.exchange.id}/accept`
      );
      const outsider = await casey.post(
        `/api/exchanges/${created.body.exchange.id}/accept`
      );

      expect(requester.status).toBe(403);
      expect(outsider.status).toBe(403);
      expect(findExchangeById(created.body.exchange.id).status).toBe('PENDING');
    });

    it('rolls back when a book is no longer available', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      run(`UPDATE books SET status = 'UNAVAILABLE' WHERE id = ?`, [alexBook.id]);

      const response = await alex.post(`/api/exchanges/${created.body.exchange.id}/accept`);

      expect(response.status).toBe(409);
      expect(findExchangeById(created.body.exchange.id).status).toBe('PENDING');
      expect(findBookById(alexBook.id).status).toBe('UNAVAILABLE');
      expect(findBookById(jordanBook.id).status).toBe('AVAILABLE');
    });

    it('prevents a second conflicting proposal from being accepted', async () => {
      const first = await propose(jordan, jordanBook.id, alexBook.id);
      const second = await propose(casey, caseyBook.id, alexBook.id);

      const accepted = await alex.post(`/api/exchanges/${first.body.exchange.id}/accept`);
      const conflict = await alex.post(`/api/exchanges/${second.body.exchange.id}/accept`);

      expect(accepted.status).toBe(200);
      expect(conflict.status).toBe(409);
      expect(findExchangeById(first.body.exchange.id).status).toBe('ACCEPTED');
      expect(findExchangeById(second.body.exchange.id).status).toBe('PENDING');
      expect(findBookById(alexBook.id).status).toBe('EXCHANGED');
      expect(findBookById(jordanBook.id).status).toBe('EXCHANGED');
      expect(findBookById(caseyBook.id).status).toBe('AVAILABLE');
    });
  });

  describe('reject and cancel', () => {
    it('lets the requested-book owner reject without changing book availability', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      const response = await alex.post(`/api/exchanges/${created.body.exchange.id}/reject`);

      expect(response.status).toBe(200);
      expect(response.body.exchange.status).toBe('REJECTED');
      expect(findBookById(alexBook.id).status).toBe('AVAILABLE');
      expect(findBookById(jordanBook.id).status).toBe('AVAILABLE');
    });

    it('lets only the requester cancel a pending exchange', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      const ownerCancel = await alex.post(
        `/api/exchanges/${created.body.exchange.id}/cancel`
      );
      const cancel = await jordan.post(`/api/exchanges/${created.body.exchange.id}/cancel`);

      expect(ownerCancel.status).toBe(403);
      expect(cancel.status).toBe(200);
      expect(cancel.body.exchange.status).toBe('CANCELLED');
      expect(findBookById(alexBook.id).status).toBe('AVAILABLE');
    });

    it('rejects invalid status transitions', async () => {
      const created = await propose(jordan, jordanBook.id, alexBook.id);
      await alex.post(`/api/exchanges/${created.body.exchange.id}/accept`);

      const rejectAccepted = await alex.post(
        `/api/exchanges/${created.body.exchange.id}/reject`
      );
      const cancelAccepted = await jordan.post(
        `/api/exchanges/${created.body.exchange.id}/cancel`
      );
      const acceptAgain = await alex.post(
        `/api/exchanges/${created.body.exchange.id}/accept`
      );

      expect(rejectAccepted.status).toBe(409);
      expect(cancelAccepted.status).toBe(409);
      expect(acceptAgain.status).toBe(409);
    });

    it('cannot reject or cancel a non-pending exchange twice', async () => {
      const rejected = await propose(jordan, jordanBook.id, alexBook.id);
      await alex.post(`/api/exchanges/${rejected.body.exchange.id}/reject`);
      const rejectAgain = await alex.post(
        `/api/exchanges/${rejected.body.exchange.id}/reject`
      );

      const cancelled = await propose(
        casey,
        caseyBook.id,
        (await createBook(alex, { title: 'Book A2' })).id
      );
      await casey.post(`/api/exchanges/${cancelled.body.exchange.id}/cancel`);
      const cancelAgain = await casey.post(
        `/api/exchanges/${cancelled.body.exchange.id}/cancel`
      );

      expect(rejectAgain.status).toBe(409);
      expect(cancelAgain.status).toBe(409);
    });
  });
});
