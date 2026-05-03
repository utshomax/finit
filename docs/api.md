# Finit API

All API responses use a JSON envelope.

```json
{ "ok": true, "data": {} }
```

Errors use:

```json
{ "ok": false, "error": { "code": "validation_error", "message": "..." } }
```

## Authentication

Session auth is cookie based.

- `POST /api/auth/register`
  - Body: `{ "email": "user@example.com", "password": "password123", "baseCurrency": "USD" }`
- `POST /api/auth/login`
  - Body: `{ "email": "user@example.com", "password": "password123" }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Automation clients authenticate with `Authorization: Bearer <raw-api-key>`.

## Accounts

Account writes require a user session. API keys can read accounts with `accounts:read`.

- `GET /api/v1/accounts`
- `POST /api/v1/accounts`
  - Body: `{ "name": "Cash", "type": "cash", "currency": "USD", "openingBalanceMinor": 10000 }`
- `GET /api/v1/accounts/:id`
- `PATCH /api/v1/accounts/:id`
- `POST /api/v1/accounts/:id/archive`

## Categories

Category writes require a user session. API keys can read categories with `categories:read`.

- `GET /api/v1/categories`
- `POST /api/v1/categories`
  - Body: `{ "name": "Groceries", "type": "expense", "color": "#16a34a", "icon": "shopping-cart" }`
- `GET /api/v1/categories/:id`
- `PATCH /api/v1/categories/:id`
- `POST /api/v1/categories/:id/archive`

## Transactions

Use `Idempotency-Key` on create requests when retrying. API keys need `transactions:read`, `transactions:write`, or `transactions:void` depending on the operation.

- `GET /api/v1/transactions?limit=50&status=active`
- `POST /api/v1/transactions`
  - Body: `{ "accountId": "...", "categoryId": "...", "type": "expense", "amountMinor": 1299, "currency": "USD", "date": "2026-05-03T00:00:00.000Z", "note": "Lunch" }`
- `POST /api/v1/transactions/:id/void`
  - Body: `{ "reason": "Duplicate entry" }`

## Transfers

Use `Idempotency-Key` on create requests when retrying. API keys need `transfers:write`; listing reuses `transactions:read`.

- `GET /api/v1/transfers?limit=50&status=active`
- `POST /api/v1/transfers`
  - Same currency body: `{ "sourceAccountId": "...", "destinationAccountId": "...", "sourceAmountMinor": 5000, "date": "2026-05-03T00:00:00.000Z" }`
  - Cross currency body: include either `destinationAmountMinor` or `exchangeRate`.
- `POST /api/v1/transfers/:id/void`
  - Body: `{ "reason": "Duplicate entry" }`

## Dashboard

API keys need `dashboard:read`.

- `GET /api/v1/dashboard`

The dashboard returns active account balances, monthly income and expenses, expense category breakdown, recent transactions, recent transfers, and base-currency net worth for accounts already denominated in the user's base currency.

## API Keys

API key management requires a user session. Raw keys are returned only when created or rotated.

- `GET /api/v1/api-keys`
- `POST /api/v1/api-keys`
  - Body: `{ "label": "Shortcuts", "scopes": ["transactions:write", "accounts:read", "categories:read"] }`
- `POST /api/v1/api-keys/:id/revoke`
- `POST /api/v1/api-keys/:id/rotate`
