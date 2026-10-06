export function formatCondition(condition) {
  const labels = {
    LIKE_NEW: 'Like new',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor'
  };

  return labels[condition] || condition;
}

export function formatBookStatus(status) {
  const labels = {
    AVAILABLE: 'Available',
    UNAVAILABLE: 'Unavailable',
    EXCHANGED: 'Exchanged'
  };

  return labels[status] || status;
}

export function formatExchangeStatus(status) {
  const labels = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled'
  };

  return labels[status] || status;
}

export function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export const BOOK_CONDITIONS = [
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' }
];

export const BOOK_STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' }
];
