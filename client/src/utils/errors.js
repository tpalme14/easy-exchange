export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) {
    return fallback;
  }

  if (error.status === 401 && error.code === 'INVALID_CREDENTIALS') {
    return 'Invalid email or password.';
  }

  if (error.status === 401) {
    return 'Please log in to continue.';
  }

  if (error.code === 'EMAIL_ALREADY_EXISTS') {
    return 'An account with this email already exists.';
  }

  if (error.code === 'DUPLICATE_EXCHANGE') {
    return 'You already have a pending proposal for these books.';
  }

  if (error.code === 'BOOK_UNAVAILABLE' || error.code === 'EXCHANGE_CONFLICT') {
    return 'Unable to complete the exchange. One of the selected books is no longer available.';
  }

  if (error.code === 'BOOK_EXCHANGED') {
    return 'This book was part of an accepted exchange and can no longer be changed.';
  }

  if (error.code === 'BOOK_IN_EXCHANGE') {
    return 'This book cannot be deleted because it is associated with an exchange.';
  }

  if (error.message && !/sqlite|stack|password_hash|session/i.test(error.message)) {
    return error.message;
  }

  return fallback;
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
