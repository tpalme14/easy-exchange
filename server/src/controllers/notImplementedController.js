import { AppError } from '../utils/errors.js';

export function notImplemented(_req, _res, next) {
  next(
    new AppError(
      501,
      'NOT_IMPLEMENTED',
      'This endpoint is not implemented yet.'
    )
  );
}
