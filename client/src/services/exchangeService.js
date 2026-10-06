import { request } from './api.js';

export function createExchange(payload) {
  return request('/exchanges', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getSentExchanges() {
  return request('/exchanges/sent');
}

export function getReceivedExchanges() {
  return request('/exchanges/received');
}

export function getExchange(id) {
  return request(`/exchanges/${id}`);
}

export function acceptExchange(id) {
  return request(`/exchanges/${id}/accept`, { method: 'POST' });
}

export function rejectExchange(id) {
  return request(`/exchanges/${id}/reject`, { method: 'POST' });
}

export function cancelExchange(id) {
  return request(`/exchanges/${id}/cancel`, { method: 'POST' });
}
