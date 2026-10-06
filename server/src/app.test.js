import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from './app.js';
import { closeDb, initializeDatabase } from './db/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';

describe('health endpoint', () => {
  beforeEach(() => {
    initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDb();
  });

  it('returns ok when the server can reach the database', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected'
    });
  });
});

describe('API error handling', () => {
  beforeEach(() => {
    initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDb();
  });

  it('returns the standard JSON error format for unknown routes', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.'
      }
    });
  });

  it('protects exchange list routes when unauthenticated', async () => {
    const response = await request(app).get('/api/exchanges/sent');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('does not expose internal error details to clients', async () => {
    const testApp = express();
    testApp.get('/boom', (_req, _res, next) => {
      next(new Error('SQLITE_CONSTRAINT_FOREIGNKEY secret details'));
    });
    testApp.use(errorHandler);

    const response = await request(testApp).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.'
      }
    });
    expect(JSON.stringify(response.body)).not.toMatch(/SQLITE|secret/i);
  });

  it('returns AppError details without leaking a stack trace', async () => {
    const testApp = express();
    testApp.get('/denied', (_req, _res, next) => {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    });
    testApp.use(errorHandler);

    const response = await request(testApp).get('/denied');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(response.body.error.stack).toBeUndefined();
    expect(response.body.stack).toBeUndefined();
  });
});
