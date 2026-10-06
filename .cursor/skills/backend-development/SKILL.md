---

name: backend-development
description: Use when implementing, modifying, debugging, or reviewing the Easy Exchange Node.js and Express backend, including REST APIs, authentication, authorization, validation, business logic, error handling, and exchange workflows.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Backend Development Skill

## Purpose

Provide consistent practices for developing the Easy Exchange backend.

## Before Making Changes

1. Read the relevant specifications in `/specs`.
2. Identify the applicable functional and technical requirements.
3. Inspect existing routes, controllers, services, and middleware.
4. Reuse existing patterns where appropriate.
5. Do not add functionality outside the specifications.

## Architecture

Follow the backend architecture defined in `specs/technical-spec.md`.

Maintain separation between:

* Routes
* Controllers
* Services/business logic
* Validation
* Middleware
* Database access
* Utilities

Routes should remain focused on HTTP concerns.

Business rules should not be duplicated across multiple routes.

## REST API

Follow the API endpoints and behavior defined in `specs/technical-spec.md`.

Use appropriate HTTP methods and status codes.

Return JSON responses consistently.

## Authentication

Authentication must be handled by the backend.

Passwords must:

* Never be stored in plaintext.
* Never be returned through the API.
* Be securely hashed.

Protected routes must require authentication.

## Authorization

Always verify authorization on the backend.

Never rely on the frontend to enforce ownership or permissions.

Before modifying a protected resource, verify that the authenticated user has permission to perform the operation.

## Validation

Validate all user-controlled input on the server.

Validate:

* Required fields
* Data types
* String lengths
* IDs
* Enum values
* Authentication
* Authorization
* Business rules

Backend validation is authoritative.

## Exchange Business Logic

Exchange operations must follow `specs/functional-spec.md`.

Pay particular attention to:

* Ownership
* Availability
* Exchange status
* Requester permissions
* Requested-book owner permissions
* Duplicate proposals
* Conflicting exchanges

Do not rely on frontend state when determining whether an exchange can be completed.

## Exchange Acceptance

Accepting an exchange must use a database transaction.

The backend must re-check the relevant book availability and exchange status during the transaction.

Do not assume that information retrieved earlier is still valid.

If the exchange cannot safely be completed, reject the operation without partially updating the database.

## Error Handling

Use the standardized API error format.

Do not expose:

* Stack traces
* SQL errors
* Password information
* Session information
* Internal implementation details

Errors should provide useful information without revealing sensitive data.

## Database Access

Use parameterized queries.

Do not construct SQL statements by directly concatenating user-provided values.

Respect foreign-key relationships and database constraints.

## Security

Follow basic secure-development practices.

At minimum:

* Validate server-side input.
* Enforce authorization.
* Hash passwords.
* Protect authenticated routes.
* Use parameterized database queries.
* Keep secrets out of source control.
* Use appropriate session configuration.
* Avoid exposing internal errors.

## Testing

Backend changes should include appropriate tests.

Prioritize tests for:

* Authentication
* Authorization
* Validation
* Business rules
* Exchange status transitions
* Database integrity
* Conflicting exchanges

## Completion Checklist

Before considering backend work complete:

* Relevant specifications were reviewed.
* Authorization is enforced.
* Input is validated.
* Business rules are enforced.
* Errors use the expected format.
* Database operations are safe.
* Relevant tests pass.
* No unnecessary API functionality was added.
