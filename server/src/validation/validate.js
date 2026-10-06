import { AppError } from '../utils/errors.js';

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => !isNonEmptyString(body?.[field]));

  if (missing.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Missing required fields: ${missing.join(', ')}`
    );
  }
}
