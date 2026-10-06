---

name: testing-code-review
description: Use when testing, reviewing, debugging, validating, or assessing Easy Exchange implementation quality against the project specifications.
------------------------------------------------------------------------------------------------------------------------------------------------------

# Testing and Code Review Skill

## Purpose

Provide a structured approach for testing and reviewing Easy Exchange.

The goal is to determine whether the implementation actually satisfies the specifications rather than simply determining whether the application appears to work.

## Before Reviewing

Read:

1. `specs/product-spec.md`
2. `specs/functional-spec.md`
3. `specs/technical-spec.md`
4. `specs/ui-spec.md`

Then inspect the relevant implementation.

## Specification Traceability

For each major requirement being reviewed, determine:

* What specification defines it?
* Where is it implemented?
* Is it tested?
* Does the implementation behave as specified?

Do not assume that untested functionality is correct.

## Functional Testing

Test important workflows including:

### Authentication

* Registration
* Duplicate email
* Login
* Invalid credentials
* Logout
* Protected routes

### Books

* Create
* Read
* Update
* Delete
* Ownership restrictions
* Availability changes
* Validation

### Exchanges

* Create proposal
* Duplicate proposal prevention
* Accept
* Reject
* Cancel
* Authorization
* Status transitions
* Conflicting exchanges

## Negative Testing

Do not test only successful scenarios.

Test:

* Missing required data
* Invalid data
* Unauthorized requests
* Nonexistent resources
* Unavailable books
* Invalid status transitions
* Duplicate operations
* Conflicting exchange requests

## Security Review

Check for:

* Plaintext passwords
* Missing authorization
* Unsafe SQL queries
* Exposed sensitive information
* Client-only security checks
* Insecure session handling
* Secrets committed to source control

## UI Review

Check:

* Loading states
* Error states
* Empty states
* Form validation
* Keyboard accessibility
* Responsive layouts
* Clear status indicators
* Appropriate confirmation for destructive actions

## Code Quality Review

Look for:

* Duplicated logic
* Overly complex functions
* Unclear names
* Unnecessary dependencies
* Tight coupling
* Violations of the documented architecture
* Code that implements functionality outside the MVP

Do not recommend architectural complexity without a clear benefit.

## Bug Classification

Classify findings as:

### Critical

Prevents core functionality, compromises security, or can corrupt data.

### High

Breaks an important workflow or violates a major functional requirement.

### Medium

Causes incorrect behavior in a non-critical scenario.

### Low

Minor usability, maintainability, or presentation issue.

## Review Output

When reporting findings, provide:

* Severity
* Requirement involved
* Problem
* Evidence
* Recommended fix

Do not modify code during a review unless explicitly asked to implement the fixes.

## Completion Criteria

A review is complete when:

* Major requirements have been evaluated.
* Critical workflows have been tested.
* Negative cases have been considered.
* Security-sensitive behavior has been reviewed.
* Findings are clearly documented.
