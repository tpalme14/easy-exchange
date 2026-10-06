# Easy Exchange — Technical Specification

## 1. Technical Overview

Easy Exchange will be implemented as a small full-stack web application using a React frontend, Node.js/Express backend, and SQLite relational database.

The architecture should remain simple and maintainable while providing clear separation between the user interface, application logic, and data persistence layers.

## 2. Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* React Router

### Backend

* Node.js
* Express
* JavaScript
* REST API

### Database

* SQLite
* Relational data model

### Testing

* Vitest
* React Testing Library
* Supertest for backend API testing

### Development Tools

* Git
* GitHub
* npm

Do not introduce additional frameworks or libraries unless they provide a clear benefit to an MVP requirement.

---

# 3. Application Architecture

The application should use a three-layer architecture:

```text
┌─────────────────────────────┐
│       React Frontend        │
│                             │
│ Pages / Components / State  │
└──────────────┬──────────────┘
               │
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│      Express REST API       │
│                             │
│ Routes                      │
│ Controllers / Services      │
│ Validation / Authorization  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          SQLite             │
│                             │
│ Users / Books / Exchanges   │
└─────────────────────────────┘
```

The frontend must not directly access the database.

The backend is responsible for:

* Authentication
* Authorization
* Validation
* Business rules
* Database operations
* Exchange state transitions

The frontend is responsible for:

* Rendering the interface
* Collecting user input
* Displaying application state
* Calling the REST API
* Providing client-side validation and feedback

Backend validation and business rules are authoritative.

---

# 4. Repository Structure

The project should use the following general structure:

```text
easy-exchange/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── db/
│   │   ├── validation/
│   │   └── utils/
│   └── ...
│
├── specs/
│   ├── product-spec.md
│   ├── functional-spec.md
│   ├── technical-spec.md
│   └── ui-spec.md
│
├── .cursor/
│   └── skills/
│
├── package.json
└── README.md
```

The exact file structure may be adjusted during implementation if a better organization is required, but the separation of frontend and backend responsibilities must be maintained.

---

# 5. Database Design

The database must contain the following core tables:

## 5.1 Users

| Column        | Type     | Requirements     |
| ------------- | -------- | ---------------- |
| id            | INTEGER  | Primary key      |
| name          | TEXT     | Required         |
| email         | TEXT     | Required, unique |
| password_hash | TEXT     | Required         |
| created_at    | DATETIME | Required         |
| updated_at    | DATETIME | Required         |

Passwords must never be stored directly.

---

## 5.2 Books

| Column      | Type     | Requirements        |
| ----------- | -------- | ------------------- |
| id          | INTEGER  | Primary key         |
| owner_id    | INTEGER  | Foreign key → Users |
| title       | TEXT     | Required            |
| author      | TEXT     | Required            |
| description | TEXT     | Optional            |
| condition   | TEXT     | Required            |
| status      | TEXT     | Required            |
| created_at  | DATETIME | Required            |
| updated_at  | DATETIME | Required            |

Allowed condition values:

```text
LIKE_NEW
GOOD
FAIR
POOR
```

Allowed status values:

```text
AVAILABLE
UNAVAILABLE
EXCHANGED
```

---

## 5.3 Exchanges

| Column            | Type     | Requirements        |
| ----------------- | -------- | ------------------- |
| id                | INTEGER  | Primary key         |
| requester_id      | INTEGER  | Foreign key → Users |
| offered_book_id   | INTEGER  | Foreign key → Books |
| requested_book_id | INTEGER  | Foreign key → Books |
| status            | TEXT     | Required            |
| created_at        | DATETIME | Required            |
| updated_at        | DATETIME | Required            |

Allowed exchange statuses:

```text
PENDING
ACCEPTED
REJECTED
CANCELLED
```

The requester is the user proposing the exchange.

The owner of `requested_book_id` is the recipient of the proposal.

---

# 6. Database Relationships

The relationships should be:

```text
Users
  │
  ├──────< Books
  │
  └──────< Exchanges
                │
                ├── offered_book_id → Books
                │
                └── requested_book_id → Books
```

A user can own many books.

A user can create many exchanges.

Each exchange references two books.

The database must enforce foreign-key relationships where supported.

---

# 7. Database Integrity

SQLite foreign-key enforcement must be enabled.

The database layer must prevent invalid foreign-key references.

The application must validate business relationships before performing exchange operations.

For example, creating an exchange must verify:

1. The requester is authenticated.
2. The offered book exists.
3. The requested book exists.
4. The requester owns the offered book.
5. The requested book belongs to another user.
6. Both books are currently available.

---

# 8. API Design

The backend must expose a REST API.

All API responses should use JSON.

API routes should be organized by resource.

---

## 8.1 Authentication

### POST `/api/auth/register`

Creates a new user.

### POST `/api/auth/login`

Authenticates a user.

### POST `/api/auth/logout`

Ends the current session.

### GET `/api/auth/me`

Returns the currently authenticated user.

---

# 9. Book API

### GET `/api/books`

Returns available books.

Supports search by:

* title
* author

### GET `/api/books/:id`

Returns details for a specific book.

### POST `/api/books`

Creates a book.

Authentication required.

### PUT `/api/books/:id`

Updates a book.

Authentication required.

The authenticated user must own the book.

### DELETE `/api/books/:id`

Deletes a book.

Authentication required.

The authenticated user must own the book.

### GET `/api/users/me/books`

Returns the authenticated user's books.

---

# 10. Exchange API

### POST `/api/exchanges`

Creates an exchange proposal.

Authentication required.

Request body should identify:

* offered book
* requested book

### GET `/api/exchanges/sent`

Returns exchanges created by the authenticated user.

### GET `/api/exchanges/received`

Returns exchanges involving books owned by the authenticated user.

### GET `/api/exchanges/:id`

Returns an exchange visible to the authenticated user.

### POST `/api/exchanges/:id/accept`

Accepts a pending exchange.

Only the requested book owner may perform this operation.

### POST `/api/exchanges/:id/reject`

Rejects a pending exchange.

Only the requested book owner may perform this operation.

### POST `/api/exchanges/:id/cancel`

Cancels a pending exchange.

Only the requester may perform this operation.

---

# 11. Authentication Architecture

The application should use server-managed authentication.

Authentication should use a secure session mechanism.

The server should:

1. Authenticate the user's credentials.
2. Create an authenticated session.
3. Associate the session with the user.
4. Require authentication middleware for protected routes.

Passwords must be hashed using a secure password-hashing algorithm.

Passwords must never be returned through the API.

The frontend should obtain the authenticated user through `/api/auth/me`.

---

# 12. Authorization

Authentication and authorization are separate concerns.

Authentication determines:

> Who is the user?

Authorization determines:

> Is this user allowed to perform this operation?

Protected backend operations must verify authorization.

Examples:

```text
PUT /api/books/:id
→ User must own the book.

DELETE /api/books/:id
→ User must own the book.

POST /api/exchanges/:id/accept
→ User must own the requested book.

POST /api/exchanges/:id/reject
→ User must own the requested book.

POST /api/exchanges/:id/cancel
→ User must be the requester.
```

The frontend must not be trusted to enforce authorization.

---

# 13. Exchange Transaction Handling

Accepting an exchange must be treated as a transactional operation.

The backend should:

1. Begin a database transaction.
2. Re-check that the exchange is still `PENDING`.
3. Re-check that both books are still `AVAILABLE`.
4. Update the exchange to `ACCEPTED`.
5. Update both books to `EXCHANGED`.
6. Commit the transaction.

If any required operation fails, the transaction must be rolled back.

This protects against conflicting exchanges involving the same book.

---

# 14. API Validation

Every API endpoint that accepts user input must validate that input before processing it.

Validation should verify:

* Required fields
* Data types
* Allowed enum values
* String lengths
* Valid IDs
* Authentication
* Authorization
* Business rules

Validation errors should return an appropriate HTTP status and a useful JSON error response.

---

# 15. HTTP Status Codes

The API should use conventional HTTP status codes.

Examples:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

Examples:

* Invalid input → `400`
* Not logged in → `401`
* Logged in but not permitted → `403`
* Resource doesn't exist → `404`
* Exchange conflict → `409`
* Unexpected server failure → `500`

---

# 16. Error Response Format

API errors should use a consistent structure.

Example:

```json
{
  "error": {
    "code": "BOOK_UNAVAILABLE",
    "message": "The selected book is no longer available for exchange."
  }
}
```

The API should not expose stack traces, database errors, passwords, or other sensitive implementation details to users.

---

# 17. Frontend Architecture

The React application should be organized around reusable components and page-level views.

Suggested pages:

```text
Login
Register
Home / Book Catalog
Book Details
My Books
Add Book
Edit Book
My Exchanges
Profile
```

Shared components may include:

```text
Navigation
BookCard
BookList
BookForm
ExchangeCard
StatusBadge
LoadingIndicator
ErrorMessage
EmptyState
ConfirmationDialog
```

Components should have a single clear responsibility where practical.

---

# 18. Frontend State

The application should maintain authentication state centrally.

The frontend should track:

* Current user
* Authentication status
* Loading state

Page-specific data should remain local to the relevant page or feature unless it is genuinely shared.

Avoid introducing a large state-management library for the MVP unless a clear requirement emerges.

---

# 19. API Communication

Frontend API calls should be centralized rather than duplicating raw HTTP requests throughout components.

A service layer should provide functions such as:

```text
registerUser()
loginUser()
logoutUser()
getCurrentUser()

getBooks()
getBook()
createBook()
updateBook()
deleteBook()

createExchange()
getSentExchanges()
getReceivedExchanges()
acceptExchange()
rejectExchange()
cancelExchange()
```

Components should call these service functions rather than constructing API requests directly.

---

# 20. Security Requirements

The application should follow basic secure-development practices.

At minimum:

* Hash passwords.
* Never expose password hashes through APIs.
* Validate all server-side input.
* Enforce authorization on the backend.
* Use parameterized database queries.
* Avoid exposing internal errors.
* Protect authenticated routes.
* Use secure session configuration appropriate for the environment.
* Do not store secrets in source control.
* Use environment variables for configuration that should not be committed.

The MVP does not require production-grade deployment infrastructure, but the code should avoid obvious security vulnerabilities.

---

# 21. Testing Strategy

Testing should occur at multiple levels.

## Unit Tests

Test isolated business logic and utility functions.

Examples:

* Book validation
* Exchange validation
* Status transitions
* Authentication helpers

## API/Integration Tests

Test backend endpoints and database behavior.

Examples:

* Registration
* Login
* Book creation
* Unauthorized book modification
* Exchange creation
* Exchange acceptance
* Exchange rejection
* Exchange cancellation
* Conflicting exchange attempts

## Component Tests

Test important React components.

Examples:

* Book form validation
* Book card rendering
* Exchange status display
* Login form
* Empty states

## End-to-End Functional Verification

At minimum, verify the complete successful exchange workflow defined in the functional specification.

---

# 22. Testing Requirements for Business Rules

The following business rules must have automated tests:

1. Users cannot exchange with themselves.
2. Users cannot offer books they do not own.
3. Users cannot request unavailable books.
4. Users cannot modify another user's books.
5. Only the requested book owner can accept an exchange.
6. Only the requested book owner can reject an exchange.
7. Only the requester can cancel an exchange.
8. Only pending exchanges can be changed.
9. Accepted exchanges make both books unavailable.
10. Conflicting exchanges cannot both be accepted.
11. Duplicate pending exchanges are rejected.

---

# 23. Environment Configuration

Environment-specific configuration should be stored outside source code.

Examples include:

```text
DATABASE_PATH
SESSION_SECRET
PORT
NODE_ENV
```

A `.env.example` file should document required environment variables without containing real secrets.

Real `.env` files must not be committed to Git.

---

# 24. Development Scripts

The project should provide simple npm scripts for common operations.

At minimum:

```text
npm run dev
npm run build
npm test
```

Additional scripts may be created for:

```text
npm run server
npm run client
npm run lint
```

The exact scripts may be adjusted based on the final project structure.

---

# 25. Code Quality

Implementation should prioritize:

* Clear naming
* Small focused functions
* Reusable components
* Separation of concerns
* Consistent error handling
* Minimal duplication
* Straightforward code over unnecessary abstraction

Do not introduce design patterns solely for the sake of demonstrating patterns.

---

# 26. Dependency Management

Dependencies should be kept to a reasonable minimum.

Before adding a dependency, determine whether:

1. It solves a real project requirement.
2. The functionality cannot reasonably be implemented with the existing stack.
3. The dependency is actively maintained and appropriate for the project.

Avoid adding libraries merely for convenience when a simple implementation is sufficient.

---

# 27. Specification Compliance

The product specification and functional specification define the required product behavior.

This technical specification defines the intended implementation architecture.

Implementation must satisfy all three specifications.

If implementation requirements conflict with a specification, identify the conflict before making a significant architectural change.

New functionality should not be added to the MVP without updating the relevant specification.
