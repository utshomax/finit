# Finit

A minimal personal finance management PWA built with Next.js, MongoDB, and TypeScript.

Track income, expenses, and transfers across multiple accounts and currencies — from the browser or via a scoped REST API for automation.

## Screenshots

<p align="center">
  <img src="screenshots/Finit _ Overview.jpeg" alt="Dashboard overview" width="48%" />
  <img src="screenshots/Finit _ Overview · 1.38am · 05-04.jpeg" alt="Overview detail" width="48%" />
</p>
<p align="center">
  <img src="screenshots/Finit _ Overview · 1.38am · 05-04 (1).jpeg" alt="Overview panel" width="48%" />
  <img src="screenshots/Finit _ Overview · 1.39am · 05-04.jpeg" alt="Overview transactions" width="48%" />
</p>

## Features

- **Multi-account support** — cash, bank, card, wallet, and more
- **Transactions** — income and expense entries with categories, notes, and merchant info
- **Transfers** — move money between accounts with cross-currency support
- **Dashboard** — net worth, account balances, monthly income/expense, and category breakdown
- **Scoped API keys** — automate transaction creation without exposing full account access
- **PWA** — installable, mobile-first, works offline
- **REST API** — versioned endpoints under `/api/v1` with full documentation

## Tech Stack

- [Next.js 15](https://nextjs.org) — app framework and API routes
- [MongoDB](https://www.mongodb.com) — database
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — UI
- [TypeScript](https://www.typescriptlang.org)

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root:

```bash
MONGODB_URI=mongodb://localhost:27017/finit
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker

Run the full stack (app + MongoDB) with Docker Compose:

```bash
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

To run only the database (and the app locally):

```bash
docker compose up mongodb
```

## API

The REST API is available under `/api/v1`. Key resource groups:

| Resource | Base path |
|---|---|
| Auth | `/api/v1/auth` |
| Accounts | `/api/v1/accounts` |
| Categories | `/api/v1/categories` |
| Transactions | `/api/v1/transactions` |
| Transfers | `/api/v1/transfers` |
| Dashboard | `/api/v1/dashboard/summary` |
| API Keys | `/api/v1/api-keys` |
| Exchange Rates | `/api/v1/exchange-rates` |

Interactive API docs are available at `/api-doc` when the app is running.

## API Key Scopes

API keys support fine-grained scopes for automation:

- `accounts:read`
- `categories:read`
- `transactions:read` / `transactions:write` / `transactions:void`
- `transfers:write`
- `dashboard:read`

Raw keys are shown only once at creation and stored hashed.
