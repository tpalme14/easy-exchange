import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyUnauthorized, request, setUnauthorizedHandler } from './api.js';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : null;
      }
    },
    json: async () => body
  };
}

describe('API request session handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
  });

  it('notifies the app when an authenticated request is unauthorized', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetch.mockResolvedValue(
      jsonResponse(401, {
        error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' }
      })
    );

    await expect(request('/books')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED'
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not treat invalid login credentials as a stale session', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetch.mockResolvedValue(
      jsonResponse(401, {
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      })
    );

    await expect(request('/auth/login', { method: 'POST' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS'
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not redirect-loop on the session check endpoint', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetch.mockResolvedValue(
      jsonResponse(401, {
        error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' }
      })
    );

    await expect(request('/auth/me')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(handler).not.toHaveBeenCalled();
    notifyUnauthorized();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
