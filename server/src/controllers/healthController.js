import { getHealth } from '../services/healthService.js';

export function getHealthStatus(_req, res, next) {
  try {
    res.json(getHealth());
  } catch (err) {
    next(err);
  }
}
