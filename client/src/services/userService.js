import { request } from './api.js';

export function updateMyProfile(payload) {
  return request('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
