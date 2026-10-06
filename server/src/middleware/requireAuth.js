import { getAuthenticatedUser } from '../services/authService.js';
import { AppError } from '../utils/errors.js';

export function requireAuth(req, _res, next) {
  const user = getAuthenticatedUser(req.session?.userId);

  if (!user) {
    return next(
      new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.')
    );
  }

  req.user = user;
  next();
}

export function optionalAuth(req, _res, next) {
  const user = getAuthenticatedUser(req.session?.userId);

  if (user) {
    req.user = user;
  }

  next();
}
