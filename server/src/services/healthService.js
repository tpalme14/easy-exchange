import { get } from '../db/query.js';
import { AppError } from '../utils/errors.js';

export function getHealth() {
  try {
    const row = get('SELECT 1 AS ok');

    if (row?.ok !== 1) {
      throw new Error('Database health check failed');
    }
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError(
      503,
      'SERVICE_UNAVAILABLE',
      'The API is unable to reach the database.'
    );
  }

  return {
    status: 'ok',
    database: 'connected'
  };
}
