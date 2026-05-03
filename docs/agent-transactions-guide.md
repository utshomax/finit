# Agent Guide: Creating Transactions via the API

A concise reference for AI agents that need to log financial transactions on behalf of a user.

---

## 1. Obtain an API Key

API keys are created through a user session. A human must do this once via the UI or by calling the endpoint with valid session cookies.

**Required scopes for transaction creation:**

| Scope | Purpose |
|---|---|
| `transactions:write` | Create transactions |
| `accounts:read` | Look up account IDs |
| `categories:read` | Look up category IDs |
| `transactions:read` | Read/verify transactions (optional) |
| `transactions:void` | Void a transaction (optional) |

**Create the key (session auth required):**

```http
POST /api/v1/api-keys
Content-Type: application/json

{
  "label": "My AI Agent",
  "scopes": ["accounts:read", "categories:read", "transactions:write"]
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "apiKey": { "id": "...", "label": "My AI Agent", "scopes": [...] },
    "rawKey": "fnk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

> **Save `rawKey` immediately.** It is shown only once and cannot be retrieved again.

---

## 2. Authenticate Requests

Pass the raw key as a Bearer token on every request:

```http
Authorization: Bearer fnk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 3. Look Up Account and Category IDs

Before creating a transaction you need the IDs of the target account and category.

```http
GET /api/v1/accounts
Authorization: Bearer <key>
```

```json
{
  "ok": true,
  "data": {
    "accounts": [
      { "id": "68170e...", "name": "Cash", "currency": "USD", "status": "active" }
    ]
  }
}
```

```http
GET /api/v1/categories
Authorization: Bearer <key>
```

```json
{
  "ok": true,
  "data": {
    "categories": [
      { "id": "68171a...", "name": "Groceries", "type": "expense", "status": "active" }
    ]
  }
}
```

Only use accounts and categories with `"status": "active"`.

---

## 4. Create a Transaction

```http
POST /api/v1/transactions
Authorization: Bearer <key>
Content-Type: application/json
Idempotency-Key: <unique-key>   ← recommended, see section 5
```

### Expense

```json
{
  "accountId": "68170e...",
  "categoryId": "68171a...",
  "type": "expense",
  "amountMinor": 1299,
  "currency": "USD",
  "date": "2026-05-04T00:00:00.000Z",
  "merchant": "Whole Foods",
  "note": "Weekly groceries"
}
```

### Income

```json
{
  "accountId": "68170e...",
  "categoryId": "<income-category-id>",
  "type": "income",
  "amountMinor": 250000,
  "currency": "USD",
  "date": "2026-05-04T00:00:00.000Z"
}
```

### Transfer (same currency)

```json
{
  "accountId": "<source-account-id>",
  "destinationAccountId": "<destination-account-id>",
  "type": "transfer",
  "amountMinor": 5000,
  "currency": "USD",
  "date": "2026-05-04T00:00:00.000Z"
}
```

### Transfer (cross-currency)

```json
{
  "accountId": "<usd-account-id>",
  "destinationAccountId": "<eur-account-id>",
  "type": "transfer",
  "amountMinor": 10000,
  "currency": "USD",
  "exchangeRate": 0.92,
  "date": "2026-05-04T00:00:00.000Z"
}
```

**Success response — HTTP 201:**
```json
{
  "ok": true,
  "data": {
    "transaction": {
      "id": "68172b...",
      "type": "expense",
      "amountMinor": 1299,
      "currency": "USD",
      "status": "active",
      "createdByType": "api_key"
    }
  }
}
```

---

## 5. Idempotency

Always send a unique `Idempotency-Key` header to prevent duplicate transactions if a request is retried.

```http
Idempotency-Key: agent-session-abc123-txn-001
```

- If the same key is sent again, the original transaction is returned with HTTP **200** and `"idempotent": true`.
- Keys must be unique per transaction. A good pattern: `<agent-id>-<source-event-id>`.

---

## 6. Field Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `accountId` | string | Yes | Must be an active account |
| `type` | string | Yes | `income`, `expense`, or `transfer` |
| `amountMinor` | integer | Yes | Amount in smallest currency unit (e.g. cents). Min: 1 |
| `currency` | string | Yes | 3-letter ISO code (e.g. `USD`). Must match account currency |
| `date` | string (ISO 8601) | Yes | Transaction date |
| `categoryId` | string | income/expense only | Must match transaction type (`income`, `expense`, or `both`) |
| `destinationAccountId` | string | transfer only | Must be a different active account |
| `destinationAmountMinor` | integer | cross-currency transfer | Explicit destination amount. Or provide `exchangeRate` |
| `exchangeRate` | number | cross-currency transfer | Used to calculate `destinationAmountMinor` if not provided |
| `merchant` | string | No | Max 160 chars |
| `note` | string | No | Max 500 chars |
| `externalRef` | string | No | Your system's reference ID. Max 160 chars |
| `metadata` | object | No | Arbitrary key/value pairs |

---

## 7. Error Handling

All errors return `"ok": false` with an `error` code:

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `validation_error` | Missing/invalid field |
| 401 | `unauthorized` | Missing or revoked API key |
| 403 | `forbidden` | API key lacks the required scope |
| 404 | `not_found` | Account or category not found or archived |
| 409 | `conflict` | Business rule conflict (e.g. currency mismatch) |

```json
{ "ok": false, "error": "not_found", "message": "Active account not found" }
```

Retry on 5xx. Do not retry on 4xx without fixing the request.
