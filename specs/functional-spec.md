# Easy Exchange — Functional Specification

## 1. Purpose

This document defines the functional behavior of the Easy Exchange application.

The functional specification translates the product requirements into specific system behaviors, validation rules, workflows, and acceptance criteria.

The implementation should conform to these requirements unless an approved specification change is made.

---

# 2. Authentication

## 2.1 User Registration

A user must be able to create an account using:

* Name
* Email address
* Password

### Requirements

* Name is required.
* Email is required.
* Email must be in a valid format.
* Email addresses must be unique.
* Password is required.
* Password must meet the application's minimum password requirements.
* Passwords must never be stored in plaintext.
* Registration should return a clear success or failure message.

### Acceptance Criteria

* A valid registration creates a new user account.
* Attempting to register an existing email produces a validation error.
* Invalid input prevents account creation.
* Password data is securely stored.

---

# 3. Login

A registered user must be able to log in using their email and password.

### Requirements

* Invalid credentials must not authenticate the user.
* Successful authentication creates an authenticated session.
* The application must provide a way to log out.
* Protected functionality must require authentication.

### Acceptance Criteria

* A valid user can log in.
* An invalid password is rejected.
* An unknown email is rejected.
* Logging out ends the authenticated session.
* Unauthenticated users cannot perform protected actions.

---

# 4. User Profile

Authenticated users must be able to view their own profile.

The profile should display:

* Name
* Email
* Number of books listed
* Number of active exchanges

Users must be able to update their name.

Users must not be able to modify their account's email through the MVP profile interface.

---

# 5. Book Management

## 5.1 Create Book

Authenticated users must be able to create a book listing.

Required fields:

* Title
* Author
* Condition

Optional field:

* Description

### Requirements

* Title is required.
* Author is required.
* Condition is required.
* Description may be empty.
* The book is associated with the authenticated user.
* New books are available for exchange by default.

### Acceptance Criteria

After successful creation:

* The book is associated with the current user.
* The book appears in the user's book collection.
* The book can appear in the available-books catalog.

---

# 6. Book Conditions

The application should use a predefined set of book-condition values:

* `LIKE_NEW`
* `GOOD`
* `FAIR`
* `POOR`

Users must select one of these values when creating or editing a book.

Arbitrary condition values should not be accepted.

---

# 7. Edit Book

Users may edit books they own.

Users may modify:

* Title
* Author
* Description
* Condition
* Exchange availability

A user must not be able to modify another user's book.

Books involved in an accepted exchange cannot be edited.

---

# 8. Delete Book

Users may delete books they own.

A book cannot be deleted if it is involved in an accepted exchange.

Deleting a book should also prevent it from appearing in the available-books catalog.

---

# 9. Book Availability

Each book must have an exchange availability state.

The application should support:

* `AVAILABLE`
* `UNAVAILABLE`
* `EXCHANGED`

### Behavior

`AVAILABLE`:

* Appears in the exchange catalog.
* Can be requested in an exchange.
* Can be offered in an exchange.

`UNAVAILABLE`:

* Does not appear as available for exchange.
* Cannot be requested.
* Cannot be offered.

`EXCHANGED`:

* Does not appear as available.
* Cannot be included in new exchange proposals.
* Indicates that the book has been involved in an accepted exchange.

---

# 10. Browse Books

Authenticated users should be able to browse books that are currently available for exchange.

The catalog should display:

* Title
* Author
* Condition
* Owner name

Selecting a book should open its detail view.

Books owned by the current user should not be presented as books they can request.

---

# 11. Search Books

Users must be able to search the available-books catalog.

Search should support:

* Book title
* Author

Search should be case-insensitive.

A search should return books where the search text matches either the title or author.

The search should only return books currently available for exchange.

---

# 12. Book Details

The book detail view must display:

* Title
* Author
* Description
* Condition
* Owner
* Availability

If the book belongs to the current user, the user should see management options instead of an exchange-request option.

If the book belongs to another user and is available, the user should be able to begin an exchange proposal.

---

# 13. Creating an Exchange Proposal

An authenticated user must be able to propose an exchange involving:

* One book they own and have available.
* One book owned by another user and currently available.

The proposal represents:

> "I will give you my book in exchange for your book."

### Requirements

* The requester must own the offered book.
* The offered book must be available.
* The requested book must belong to another user.
* The requested book must be available.
* Both books must exist.
* The requester must be authenticated.

The system must reject invalid proposals.

---

# 14. Exchange Confirmation

Before submitting a proposal, the user must be shown a confirmation view containing:

### You Offer

* Book title
* Author
* Condition

### You Request

* Book title
* Author
* Condition

The user must explicitly confirm the proposal before it is submitted.

---

# 15. Duplicate Exchange Proposals

The system should prevent a user from creating multiple identical pending proposals involving the same two books.

For example, if User A has already proposed:

> Book A → Book B

User A should not be able to submit another identical pending proposal.

---

# 16. Exchange Requests

Users must have access to two exchange views:

### Sent

Displays exchanges proposed by the current user.

### Received

Displays exchanges where the current user's book was requested.

Each exchange should display:

* Offered book
* Requested book
* Other user's name
* Exchange status
* Date created

---

# 17. Exchange Status

Exchange statuses are:

* `PENDING`
* `ACCEPTED`
* `REJECTED`
* `CANCELLED`

### PENDING

The proposal has been submitted but has not received a response.

### ACCEPTED

The requested book owner accepted the proposal.

Both books involved become `EXCHANGED`.

### REJECTED

The requested book owner rejected the proposal.

Both books remain available if they were available before the proposal.

### CANCELLED

The requester cancelled the proposal before it was accepted or rejected.

Both books remain available.

---

# 18. Accepting an Exchange

Only the owner of the requested book may accept an exchange.

An exchange may only be accepted while its status is `PENDING`.

When accepted:

1. Exchange status changes to `ACCEPTED`.
2. Offered book becomes `EXCHANGED`.
3. Requested book becomes `EXCHANGED`.
4. The exchange can no longer be modified.
5. Neither book can participate in another exchange.

If either book is no longer available when the request is accepted, the operation must fail rather than creating an invalid exchange.

---

# 19. Rejecting an Exchange

Only the owner of the requested book may reject an exchange.

The exchange must have a status of `PENDING`.

When rejected:

1. Exchange status changes to `REJECTED`.
2. Neither book is marked as exchanged.
3. The books remain available if their owners have not otherwise made them unavailable.

---

# 20. Cancelling an Exchange

Only the requester may cancel an exchange.

The exchange must have a status of `PENDING`.

When cancelled:

1. Exchange status changes to `CANCELLED`.
2. Neither book is marked as exchanged.
3. The books remain available.

---

# 21. Concurrent Exchange Protection

The system must prevent two users from successfully accepting conflicting exchanges involving the same book.

For example:

* User A requests Book X.
* User B also requests Book X.
* The owner accepts User A's request.

User B's pending request must no longer be able to successfully complete an exchange involving Book X.

The backend must perform the necessary availability validation when accepting an exchange rather than relying solely on frontend state.

---

# 22. Authorization

The backend must verify ownership and permissions for protected operations.

Users may:

* Modify their own books.
* Delete their own books.
* View their own exchange activity.
* Create exchanges involving their own books.
* Cancel exchanges they created.

Users may not:

* Modify another user's books.
* Delete another user's books.
* Accept exchanges involving another user's books.
* Reject exchanges involving another user's books.
* Cancel exchanges created by another user.
* Create exchanges using books they do not own.

Authorization must be enforced by the backend.

---

# 23. Validation and Errors

The application must validate user input on both the frontend and backend.

Backend validation is authoritative.

Errors should provide useful messages without exposing sensitive implementation details.

Common error conditions include:

* Invalid form input
* Invalid credentials
* Duplicate email
* Book not found
* Unauthorized book modification
* Book unavailable
* Invalid exchange
* Unauthorized exchange action
* Exchange no longer pending
* Conflicting exchange

---

# 24. Empty States

The application should provide useful empty states.

Examples:

### No Books

> You haven't listed any books yet.

### No Available Books

> No books are currently available for exchange.

### No Sent Exchanges

> You haven't proposed any exchanges yet.

### No Received Exchanges

> You don't have any exchange requests.

Empty states should provide an appropriate next action when possible.

---

# 25. Loading States

The interface should provide visual feedback while waiting for asynchronous operations.

Loading states should be used for:

* Authentication requests
* Book loading
* Book creation/editing/deletion
* Search
* Exchange creation
* Exchange acceptance/rejection/cancellation

Users should not be able to accidentally submit the same action repeatedly while an operation is in progress.

---

# 26. Success Feedback

Successful operations should provide clear feedback.

Examples include:

* Account created successfully.
* Book added successfully.
* Book updated successfully.
* Exchange proposal submitted.
* Exchange accepted.
* Exchange rejected.
* Exchange cancelled.

Feedback should be visible without requiring the user to inspect application logs.

---

# 27. Data Integrity

The system must maintain consistent relationships between users, books, and exchanges.

Important relationships include:

* Every book must belong to one user.
* Every exchange must have one requester.
* Every exchange must have one requested book owner.
* Every exchange must reference valid books.
* Exchange participants must correspond to the owners of the associated books.

Invalid references must not be accepted.

---

# 28. Acceptance Criteria for the MVP

The MVP is functionally complete when the following scenario works from beginning to end:

1. User A creates an account.
2. User B creates an account.
3. User A logs in.
4. User A adds a book.
5. User A marks the book as available.
6. User B logs in.
7. User B adds a different book.
8. User B marks the book as available.
9. User B browses User A's book.
10. User B selects their own available book as the offered book.
11. User B submits an exchange proposal.
12. User A sees the incoming proposal.
13. User A accepts the proposal.
14. The exchange becomes `ACCEPTED`.
15. Both books become `EXCHANGED`.
16. Neither book can be used in another exchange.
17. Both users can view the completed exchange in their exchange history.

The application must also correctly handle rejected and cancelled exchanges and prevent unauthorized actions.

---

# 29. Functional Scope Boundary

If a requested feature is not described in this specification or the product specification, it should not be assumed to be part of the MVP.

New functionality should require an explicit change to the appropriate specification before implementation.
