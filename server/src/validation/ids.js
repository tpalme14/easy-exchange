import { AppError } from '../utils/errors.js';

export function parsePositiveId(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
    return value;
  }

  const id = Number.parseInt(value, 10);

  if (!Number.isInteger(id) || String(id) !== String(value) || id < 1) {
    return null;
  }

  return id;
}

export function requirePositiveId(value, fieldName) {
  const id = parsePositiveId(value);

  if (id == null) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid id.`);
  }

  return id;
}
