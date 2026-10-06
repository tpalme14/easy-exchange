import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from './app.js';
import { closeDb, initializeDatabase } from './db/connection.js';
import { findUserByEmail } from './db/users.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/requireAuth.js';
import { createSessionMiddleware } from './middleware/session.js';
import { verifyPassword } from './utils/password.js';

const validUser = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  password: 'password123'
};

function createAgent() {
  return request.agent(app);
}

async function registerUser(agent, overrides = {}) {
  return agent.post('/api/auth/register').send({
    ...validUser,
    ...overrides
  });
}

describe('authentication', () => {
  beforeEach(() => {
    initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDb();
  });

  describe('POST /api/auth/register', () => {
    it('creates a user, hashes the password, and establishes a session', async () => {
      const agent = createAgent();
      const response = await registerUser(agent);

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        name: 'Alex Rivera',
        email: 'alex@example.com'
      });
      expect(response.body.user.id).toEqual(expect.any(Number));
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.password_hash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toMatch(/password/i);

      const stored = findUserByEmail('alex@example.com');
      expect(stored.password_hash).not.toBe(validUser.password);
      expect(stored.password_hash.startsWith('scrypt$')).toBe(true);
      expect(await verifyPassword(validUser.password, stored.password_hash)).toBe(true);

      const me = await agent.get('/api/auth/me');
      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe('alex@example.com');
    });

    it('normalizes email addresses', async () => {
      const response = await registerUser(createAgent(), {
        email: '  Alex@Example.COM '
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('alex@example.com');
    });

    it('rejects missing required fields', async () => {
      const response = await createAgent().post('/api/auth/register').send({
        name: 'Alex'
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid email and short passwords', async () => {
      const invalidEmail = await registerUser(createAgent(), {
        email: 'not-an-email'
      });
      const shortPassword = await registerUser(createAgent(), {
        email: 'jordan@example.com',
        password: 'short'
      });

      expect(invalidEmail.status).toBe(400);
      expect(invalidEmail.body.error.code).toBe('INVALID_EMAIL');
      expect(shortPassword.status).toBe(400);
      expect(shortPassword.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('rejects duplicate email addresses', async () => {
      await registerUser(createAgent());
      const response = await registerUser(createAgent(), {
        name: 'Jordan'
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toEqual({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists.'
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates a user and establishes a session', async () => {
      await registerUser(createAgent());
      const agent = createAgent();
      const response = await agent.post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password
      });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user.password_hash).toBeUndefined();
      expect(response.headers['set-cookie']).toBeDefined();

      const me = await agent.get('/api/auth/me');
      expect(me.status).toBe(200);
      expect(me.body.user.name).toBe(validUser.name);
    });

    it('rejects an incorrect password without revealing account details', async () => {
      await registerUser(createAgent());
      const response = await createAgent().post('/api/auth/login').send({
        email: validUser.email,
        password: 'wrong-password'
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    });

    it('rejects an unknown account with the same error as a bad password', async () => {
      const unknown = await createAgent().post('/api/auth/login').send({
        email: 'missing@example.com',
        password: 'password123'
      });
      await registerUser(createAgent());
      const wrongPassword = await createAgent().post('/api/auth/login').send({
        email: validUser.email,
        password: 'wrong-password'
      });

      expect(unknown.status).toBe(401);
      expect(unknown.body.error).toEqual(wrongPassword.body.error);
    });

    it('rejects missing fields', async () => {
      const response = await createAgent().post('/api/auth/login').send({
        email: validUser.email
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/logout and GET /api/auth/me', () => {
    it('returns the current user without a password hash', async () => {
      const agent = createAgent();
      await registerUser(agent);
      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: expect.any(Number),
        name: validUser.name,
        email: validUser.email
      });
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('returns 401 when no session exists', async () => {
      const response = await createAgent().get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('ends the session so later requests are unauthenticated', async () => {
      const agent = createAgent();
      await registerUser(agent);

      const logout = await agent.post('/api/auth/logout');
      const me = await agent.get('/api/auth/me');

      expect(logout.status).toBe(200);
      expect(logout.body.message).toBe('Logged out.');
      expect(me.status).toBe(401);
    });

    it('logs out safely when no session exists', async () => {
      const response = await createAgent().post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out.');
    });
  });

  describe('requireAuth middleware', () => {
    it('attaches the authenticated user when a valid session exists', async () => {
      const agent = createAgent();
      await registerUser(agent);
      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('rejects missing and invalid sessions', async () => {
      const missing = await createAgent().get('/api/auth/me');
      const invalid = await createAgent()
        .get('/api/auth/me')
        .set('Cookie', 'easyExchange.sid=s%3Ainvalid.signature');

      expect(missing.status).toBe(401);
      expect(invalid.status).toBe(401);
      expect(missing.body.error.code).toBe('UNAUTHENTICATED');
      expect(invalid.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('can protect other routes using the same middleware', async () => {
      const protectedApp = express();
      protectedApp.use(createSessionMiddleware());
      protectedApp.get('/protected', requireAuth, (req, res) => {
        res.json({ user: req.user });
      });
      protectedApp.use(errorHandler);

      const response = await request(protectedApp).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('PUT /api/users/me', () => {
    it('updates the authenticated user name and does not allow email changes', async () => {
      const agent = createAgent();
      await registerUser(agent);
      const response = await agent.put('/api/users/me').send({
        name: 'Alex Updated',
        email: 'hacker@example.com'
      });
      const me = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Alex Updated');
      expect(me.body.user.email).toBe(validUser.email);
    });
  });
});
