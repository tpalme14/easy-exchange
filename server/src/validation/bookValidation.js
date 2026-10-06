import { BOOK_CONDITIONS } from '../db/constants.js';
import { isNonEmptyString, requireFields } from './validate.js';
import { AppError } from '../utils/errors.js';

const MAX_TITLE_LENGTH = 200;
const MAX_AUTHOR_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const EDITABLE_STATUSES = ['AVAILABLE', 'UNAVAILABLE'];

function normalizeOptionalText(value) {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Description must be text.');
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function validateTitle(title) {
  if (!isNonEmptyString(title) || title.trim().length > MAX_TITLE_LENGTH) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Title is required and must be at most 200 characters.'
    );
  }

  return title.trim();
}

function validateAuthor(author) {
  if (!isNonEmptyString(author) || author.trim().length > MAX_AUTHOR_LENGTH) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Author is required and must be at most 200 characters.'
    );
  }

  return author.trim();
}

function validateCondition(condition) {
  if (!BOOK_CONDITIONS.includes(condition)) {
    throw new AppError(
      400,
      'INVALID_CONDITION',
      'Condition must be LIKE_NEW, GOOD, FAIR, or POOR.'
    );
  }

  return condition;
}

function validateAvailability(status) {
  if (!EDITABLE_STATUSES.includes(status)) {
    throw new AppError(
      400,
      'INVALID_STATUS',
      'Availability must be AVAILABLE or UNAVAILABLE.'
    );
  }

  return status;
}

function validateDescription(description) {
  const normalized = normalizeOptionalText(description);

  if (normalized && normalized.length > MAX_DESCRIPTION_LENGTH) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Description must be at most 2000 characters.'
    );
  }

  return normalized;
}

export function validateCreateBookInput(body) {
  requireFields(body, ['title', 'author', 'condition']);

  return {
    title: validateTitle(body.title),
    author: validateAuthor(body.author),
    condition: validateCondition(body.condition),
    description: validateDescription(body.description)
  };
}

export function validateUpdateBookInput(body, currentBook) {
  const title = body.title === undefined ? currentBook.title : validateTitle(body.title);
  const author = body.author === undefined ? currentBook.author : validateAuthor(body.author);
  const condition =
    body.condition === undefined
      ? currentBook.condition
      : validateCondition(body.condition);
  const description =
    body.description === undefined
      ? currentBook.description
      : validateDescription(body.description);
  const status =
    body.status === undefined
      ? currentBook.status
      : validateAvailability(body.status);

  return { title, author, condition, description, status };
}

import { parsePositiveId } from './ids.js';

export function parseBookId(value) {
  return parsePositiveId(value);
}
