const API_BASE = '/api';

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}

function shouldClearSession(path, error) {
  return (
    error.status === 401 &&
    error.code === 'UNAUTHENTICATED' &&
    path !== '/auth/me' &&
    path !== '/auth/login' &&
    path !== '/auth/register' &&
    path !== '/auth/logout'
  );
}

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Request failed');
    error.status = response.status;
    error.code = data?.error?.code;

    if (shouldClearSession(path, error)) {
      notifyUnauthorized();
    }

    throw error;
  }

  return data;
}
