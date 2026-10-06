# Easy Exchange

A web application for direct book-for-book exchanges.

## Requirements

- Node.js 20 or later
- npm

## Setup

1. Copy `.env.example` to `.env` and replace `SESSION_SECRET` with a long random string.
2. Install dependencies:

```bash
npm install
```

## Development

Run the API and the Vite frontend together:

```bash
npm run dev
```

Or start them separately:

```bash
npm run server
npm run client
```

The frontend development server proxies `/api` requests to the backend.

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Other scripts

```bash
npm run build
npm test
```

## Project structure

- `client/` — React + Vite frontend
- `server/` — Node.js + Express API and SQLite database layer
- `specs/` — product, functional, technical, and UI specifications
