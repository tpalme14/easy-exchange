---

name: frontend-development
description: Use when implementing, modifying, debugging, or reviewing the React frontend of Easy Exchange. Applies to pages, components, forms, client-side state, API integration, accessibility, responsive behavior, and frontend validation.
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Frontend Development Skill

## Purpose

Provide consistent practices for developing the Easy Exchange React frontend.

## Before Making Changes

1. Read the relevant specifications in `/specs`.
2. Identify the requirements related to the requested frontend change.
3. Inspect existing components and patterns before creating new ones.
4. Reuse existing components when appropriate.
5. Do not introduce functionality that is not defined by the specifications.

## Architecture

Follow the frontend architecture defined in `specs/technical-spec.md`.

Use:

* React
* React Router
* JavaScript
* CSS

Keep responsibilities separated between:

* Pages
* Reusable components
* API/service functions
* Hooks
* Shared application state
* Utility functions

Components should have clear responsibilities.

## UI Requirements

Follow `specs/ui-spec.md`.

Maintain:

* Consistent layout
* Consistent spacing
* Consistent typography
* Consistent buttons and forms
* Responsive behavior
* Accessible interactions

Do not add unnecessary visual effects or UI features.

## Forms

Forms should:

* Clearly identify required fields.
* Provide useful validation messages.
* Prevent invalid submissions.
* Disable submission controls while requests are processing.
* Display server-side validation errors.
* Preserve user input when appropriate after validation failures.

Client-side validation improves usability but must not replace backend validation.

## API Communication

Use the frontend service layer for API requests.

Do not scatter raw API requests throughout components.

Handle:

* Loading
* Success
* Validation errors
* Authentication errors
* Authorization errors
* Not-found responses
* Conflict responses
* Unexpected errors

## Authentication

Do not assume that frontend state alone determines authorization.

Authentication state should be obtained from the backend.

Protected pages should respond appropriately when the user is unauthenticated.

## Accessibility

Use semantic HTML and accessible controls.

Ensure:

* Form fields have labels.
* Buttons have descriptive text.
* Interactive controls are keyboard accessible.
* Focus states remain visible.
* Errors are understandable.
* Status is not communicated through color alone.
* Heading hierarchy is logical.

## Responsive Design

Verify layouts at:

* Desktop
* Tablet
* Mobile

Avoid fixed layouts that require horizontal scrolling.

## Error and Empty States

Every data-driven page should consider:

* Loading state
* Successful state
* Empty state
* Error state

Follow the examples and requirements in `specs/ui-spec.md`.

## Testing

When implementing frontend functionality:

1. Add or update relevant tests.
2. Test important user interactions.
3. Test validation behavior.
4. Test error states where appropriate.
5. Run the relevant test suite.

Do not modify tests simply to make an implementation pass.

## Dependencies

Do not add frontend dependencies unless they solve a real project requirement.

Prefer existing project capabilities when they are sufficient.

## Completion Checklist

Before considering frontend work complete:

* Relevant specifications were reviewed.
* Existing patterns were reused where appropriate.
* UI requirements are satisfied.
* Loading/error/empty states are handled.
* Accessibility requirements are satisfied.
* Responsive behavior is considered.
* Relevant tests pass.
* No unnecessary functionality was added.
