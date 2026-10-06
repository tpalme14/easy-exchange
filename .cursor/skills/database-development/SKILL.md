---

name: database-development
description: Use when designing, modifying, querying, testing, or reviewing the Easy Exchange SQLite database, including schema changes, relationships, constraints, indexes, transactions, and data integrity.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Database Development Skill

## Purpose

Provide consistent practices for working with the Easy Exchange SQLite database.

## Before Making Changes

1. Read `specs/technical-spec.md`.
2. Read relevant requirements from `specs/functional-spec.md`.
3. Inspect the existing database schema and database access code.
4. Determine whether the requested change requires a schema change.
5. Avoid unnecessary schema complexity.

## Schema

The database must support the core entities:

* Users
* Books
* Exchanges

Follow the schema defined in `specs/technical-spec.md`.

## Relationships

Maintain the required relationships:

* User → Books
* User → Exchanges
* Exchange → Offered Book
* Exchange → Requested Book

Foreign-key enforcement must be enabled.

## Constraints

Use database constraints where appropriate to protect data integrity.

Examples include:

* Primary keys
* Foreign keys
* Unique email addresses
* Required fields
* Appropriate indexes

Application-level validation should complement, not replace, database integrity.

## Queries

Use parameterized queries for all values originating from users or external input.

Never construct SQL by concatenating untrusted values.

Queries should retrieve only the data required by the operation.

## Transactions

Use transactions for operations that require multiple related database changes.

Exchange acceptance is a required transactional operation because it updates:

* Exchange status
* Offered book status
* Requested book status

A failure must not leave the database partially updated.

## Migrations

If the application requires schema changes after initial creation:

1. Document the change.
2. Ensure existing data can be handled safely.
3. Avoid destructive changes unless explicitly required.
4. Keep the database schema synchronized with the technical specification.

## Performance

The MVP does not require advanced database optimization.

However:

* Index frequently searched fields where appropriate.
* Avoid unnecessary queries.
* Avoid retrieving excessive data.
* Prefer straightforward queries over premature optimization.

## Data Integrity

The database should never allow invalid references between core entities.

Business rules that depend on multiple records should be enforced by the application within appropriate transactions.

## Testing

Database-related changes should include tests where practical.

Test:

* Foreign-key behavior
* Unique constraints
* Valid inserts
* Invalid inserts
* Exchange transactions
* Data consistency after failures

## Completion Checklist

Before considering database work complete:

* Schema matches the technical specification.
* Relationships are correct.
* Foreign keys are enabled.
* Queries are parameterized.
* Required transactions are implemented.
* Data integrity is maintained.
* Relevant tests pass.
