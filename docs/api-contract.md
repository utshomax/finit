# API Contract

Base URL for browser calls in the app: same origin.

All custom backend routes return JSON envelopes except framework-generated errors such as unsupported HTTP methods.

Success:

```json
{ "ok": true, "data": {} }
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "Human readable message",
    "details": {}
  }
}
```

Common status codes:

- `200`: success
- `201`: created
- `204`: success with no body
- `400`: bad request or validation error
- `401`: not authenticated or invalid API key
- `403`: authenticated but missing permission/scope
- `404`: resource not found
- `409`: conflict

## Auth

Session auth uses an HTTP-only cookie named `finit_session`. Frontend requests should use normal same-origin `fetch`; no manual token handling is needed for user sessions.

API-key automation uses:

```txt
Authorization: Bearer finit_...
```

### Register

`POST /api/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "baseCurrency": "USD"
}
```

Response `201`:

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "objectId",
      "email": "user@example.com",
      "baseCurrency": "USD",
      "createdAt": "2026-05-03T00:00:00.000Z",
      "updatedAt": "2026-05-03T00:00:00.000Z"
    }
  }
}
```

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response `200`: same as register.

### Logout

`POST /api/auth/logout`

Response `204`: no body.

### Current User

`GET /api/auth/me`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "objectId",
      "email": "user@example.com",
      "baseCurrency": "USD",
      "createdAt": "2026-05-03T00:00:00.000Z",
      "updatedAt": "2026-05-03T00:00:00.000Z"
    }
  }
}
```

## Accounts

Types: `cash`, `bank`, `card`, `wallet`, `savings`, `loan`, `other`

Status: `active`, `archived`

Account writes require a user session. API keys can read accounts with `accounts:read`.

### List Accounts

`GET /api/v1/accounts`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "accounts": [
      {
        "id": "objectId",
        "name": "Cash",
        "type": "cash",
        "currency": "USD",
        "openingBalanceMinor": 10000,
        "balanceMinor": 12500,
        "status": "active",
        "createdAt": "2026-05-03T00:00:00.000Z",
        "updatedAt": "2026-05-03T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Account

`POST /api/v1/accounts`

Request:

```json
{
  "name": "Cash",
  "type": "cash",
  "currency": "USD",
  "openingBalanceMinor": 10000
}
```

Response `201`:

```json
{
  "ok": true,
  "data": {
    "account": {}
  }
}
```

### Get Account

`GET /api/v1/accounts/:id`

Response `200`: `{ "ok": true, "data": { "account": {} } }`

### Update Account

`PATCH /api/v1/accounts/:id`

Request fields are optional:

```json
{
  "name": "Pocket Cash",
  "type": "cash",
  "currency": "USD",
  "openingBalanceMinor": 12000
}
```

Note: `currency` cannot change after transactions or transfers exist.

Response `200`: `{ "ok": true, "data": { "account": {} } }`

### Archive Account

`POST /api/v1/accounts/:id/archive`

Response `200`: `{ "ok": true, "data": { "account": {} } }`

## Categories

Types: `income`, `expense`, `both`

Status: `active`, `archived`

Category writes require a user session. API keys can read categories with `categories:read`.

### List Categories

`GET /api/v1/categories`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "categories": [
      {
        "id": "objectId",
        "name": "Groceries",
        "type": "expense",
        "color": "#16a34a",
        "icon": "shopping-cart",
        "status": "active",
        "createdAt": "2026-05-03T00:00:00.000Z",
        "updatedAt": "2026-05-03T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Category

`POST /api/v1/categories`

Request:

```json
{
  "name": "Groceries",
  "type": "expense",
  "color": "#16a34a",
  "icon": "shopping-cart"
}
```

Response `201`: `{ "ok": true, "data": { "category": {} } }`

### Get Category

`GET /api/v1/categories/:id`

Response `200`: `{ "ok": true, "data": { "category": {} } }`

### Update Category

`PATCH /api/v1/categories/:id`

Request fields are optional:

```json
{
  "name": "Food",
  "type": "expense",
  "color": "#16a34a",
  "icon": "utensils"
}
```

Response `200`: `{ "ok": true, "data": { "category": {} } }`

### Archive Category

`POST /api/v1/categories/:id/archive`

Response `200`: `{ "ok": true, "data": { "category": {} } }`

## Transactions

Types: `income`, `expense`

Status: `active`, `voided`

Amounts are integer minor units. Use `Idempotency-Key` on create requests that may be retried.

API-key scopes:

- Read: `transactions:read`
- Create: `transactions:write`
- Void: `transactions:void`

### List Transactions

`GET /api/v1/transactions?limit=50&status=active&accountId=:id&categoryId=:id`

All query params are optional. `limit` maxes at `100`.

Response `200`:

```json
{
  "ok": true,
  "data": {
    "transactions": [
      {
        "id": "objectId",
        "accountId": "objectId",
        "categoryId": "objectId",
        "type": "expense",
        "amountMinor": 1299,
        "currency": "USD",
        "date": "2026-05-03T00:00:00.000Z",
        "note": "Lunch",
        "merchant": "Market",
        "externalRef": "external-id",
        "metadata": {},
        "status": "active",
        "voidedAt": null,
        "voidedByType": null,
        "voidedById": null,
        "voidReason": null,
        "createdByType": "user",
        "createdById": "objectId",
        "createdAt": "2026-05-03T00:00:00.000Z",
        "updatedAt": "2026-05-03T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Transaction

`POST /api/v1/transactions`

Headers:

```txt
Idempotency-Key: optional-client-generated-key
```

Request:

```json
{
  "accountId": "objectId",
  "categoryId": "objectId",
  "type": "expense",
  "amountMinor": 1299,
  "currency": "USD",
  "date": "2026-05-03T00:00:00.000Z",
  "note": "Lunch",
  "merchant": "Market",
  "externalRef": "external-id",
  "metadata": {}
}
```

Response `201`:

```json
{
  "ok": true,
  "data": {
    "transaction": {}
  }
}
```

Idempotent replay response `200`:

```json
{
  "ok": true,
  "data": {
    "transaction": {},
    "idempotent": true
  }
}
```

### Void Transaction

`POST /api/v1/transactions/:id/void`

Request:

```json
{
  "reason": "Duplicate entry"
}
```

Response `200`: `{ "ok": true, "data": { "transaction": {} } }`

## Transfers

Status: `active`, `voided`

Amounts are integer minor units. Use `Idempotency-Key` on create requests that may be retried.

API-key scopes:

- List: `transactions:read`
- Create and void: `transfers:write`

### List Transfers

`GET /api/v1/transfers?limit=50&status=active`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "transfers": [
      {
        "id": "objectId",
        "sourceAccountId": "objectId",
        "destinationAccountId": "objectId",
        "sourceAmountMinor": 5000,
        "sourceCurrency": "USD",
        "destinationAmountMinor": 5000,
        "destinationCurrency": "USD",
        "exchangeRate": null,
        "date": "2026-05-03T00:00:00.000Z",
        "note": "Move to savings",
        "status": "active",
        "voidedAt": null,
        "voidedByType": null,
        "voidedById": null,
        "voidReason": null,
        "createdByType": "user",
        "createdById": "objectId",
        "createdAt": "2026-05-03T00:00:00.000Z",
        "updatedAt": "2026-05-03T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Transfer

`POST /api/v1/transfers`

Same-currency request:

```json
{
  "sourceAccountId": "objectId",
  "destinationAccountId": "objectId",
  "sourceAmountMinor": 5000,
  "date": "2026-05-03T00:00:00.000Z",
  "note": "Move to savings"
}
```

Cross-currency request:

```json
{
  "sourceAccountId": "objectId",
  "destinationAccountId": "objectId",
  "sourceAmountMinor": 1000,
  "destinationAmountMinor": 900,
  "exchangeRate": 0.9,
  "date": "2026-05-03T00:00:00.000Z"
}
```

For cross-currency transfers, include either `destinationAmountMinor` or `exchangeRate`.

Response `201`: `{ "ok": true, "data": { "transfer": {} } }`

Idempotent replay response `200`: `{ "ok": true, "data": { "transfer": {}, "idempotent": true } }`

### Void Transfer

`POST /api/v1/transfers/:id/void`

Request:

```json
{
  "reason": "Duplicate entry"
}
```

Response `200`: `{ "ok": true, "data": { "transfer": {} } }`

## Dashboard

API keys need `dashboard:read`.

`GET /api/v1/dashboard`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "dashboard": {
      "baseCurrency": "USD",
      "netWorthMinor": 12500,
      "totalsByCurrency": {
        "USD": 12500
      },
      "missingConversionCurrencies": [],
      "accounts": [],
      "monthly": {
        "incomeMinor": 2500,
        "expenseMinor": 1299
      },
      "expenseByCategory": [
        {
          "categoryId": "objectId",
          "categoryName": "Groceries",
          "currency": "USD",
          "amountMinor": 1299
        }
      ],
      "recentTransactions": [],
      "recentTransfers": []
    }
  }
}
```

Note: `netWorthMinor` currently includes only accounts already denominated in the user's `baseCurrency`; other currencies are listed in `missingConversionCurrencies`.

## API Keys

API-key management requires a user session. Raw keys are shown only on create and rotate.

Scopes:

- `accounts:read`
- `categories:read`
- `transactions:read`
- `transactions:write`
- `transactions:void`
- `transfers:write`
- `dashboard:read`

### List API Keys

`GET /api/v1/api-keys`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "apiKeys": [
      {
        "id": "objectId",
        "label": "Shortcuts",
        "prefix": "finit_abc123...",
        "scopes": ["transactions:write"],
        "lastUsedAt": null,
        "revokedAt": null,
        "createdAt": "2026-05-03T00:00:00.000Z",
        "updatedAt": "2026-05-03T00:00:00.000Z"
      }
    ]
  }
}
```

### Create API Key

`POST /api/v1/api-keys`

Request:

```json
{
  "label": "Shortcuts",
  "scopes": ["transactions:write", "accounts:read", "categories:read"]
}
```

Response `201`:

```json
{
  "ok": true,
  "data": {
    "apiKey": {},
    "rawKey": "finit_secret"
  }
}
```

### Revoke API Key

`POST /api/v1/api-keys/:id/revoke`

Response `200`: `{ "ok": true, "data": { "apiKey": {} } }`

### Rotate API Key

`POST /api/v1/api-keys/:id/rotate`

Response `200`:

```json
{
  "ok": true,
  "data": {
    "apiKey": {},
    "rawKey": "finit_new_secret"
  }
}
```

## Frontend Fetch Helper Shape

Suggested TypeScript shape:

```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

Suggested fetch pattern:

```ts
async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  return response.json();
}
```
