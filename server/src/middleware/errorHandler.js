import { AppError, sendError } from '../utils/errors.js';

export function notFoundHandler(_req, res) {
  return sendError(res, 404, 'NOT_FOUND', 'The requested resource was not found.');
}

function isInvalidJsonError(err) {
  return (
    err instanceof SyntaxError &&
    (err.status === 400 || err.statusCode === 400) &&
    'body' in err
  );
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message);
  }

  if (isInvalidJsonError(err)) {
    return sendError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred.'
  );
}
