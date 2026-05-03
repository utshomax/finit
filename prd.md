# Personal Finance Management Web App PRD

## 1. Executive Summary

**Problem Statement**: Personal finance tracking often becomes too complex for daily use, especially when managing multiple accounts, currencies, categories, and automated transaction entry. The product must keep financial tracking minimal while still supporting reliable account balances, currency conversion, and automation.

**Proposed Solution**: Build a minimal personal finance management PWA using Next.js and MongoDB, with email/password login, multi-account support, ISO-currency transactions, transfers, categories, dashboard insights, and scoped REST API keys for automation.

**Success Criteria**:

- User can add an income, expense, or transfer transaction from mobile in <= 10 seconds after login.
- REST API supports account, category, transaction, transfer, dashboard, and API-key operations with documented request/response schemas.
- Dashboard loads in <= 1.5s p95 for a user with 10 accounts and 10,000 transactions.
- 100% of transaction mutations are attributable to either a logged-in user or a scoped API key.
- PWA passes installability checks and achieves Lighthouse scores >= 90 for Performance, Accessibility, Best Practices, and SEO on the dashboard route.

## 2. User Experience & Functionality

### User Personas

- **Primary User**: Individual managing personal finances across cash, bank, card, wallet, and similar accounts.
- **Automation User**: Same user using scripts, shortcuts, notification parsers, or other automation tools to create transactions through the REST API.

### User Stories

- As a user, I want to sign in with email and password so that my financial data is private.
- As a user, I want to create multiple accounts with different currencies so that I can track balances across wallets, banks, and cards.
- As a user, I want to record income and expense transactions with categories so that I can understand where money comes from and where it goes.
- As a user, I want to transfer money between accounts so that account balances remain accurate.
- As a user, I want currency conversion support so that I can see totals and insights in a preferred base currency.
- As a user, I want a clean mobile PWA dashboard so that I can quickly review balances, spending, income, and trends.
- As a user, I want scoped API keys so that automation can create or read transactions without exposing full account access.

### Acceptance Criteria

#### Authentication

- User can register, sign in, sign out, and maintain a session using email and password.
- Email addresses must be unique.
- Passwords must be stored using Argon2id, bcrypt, or another modern password hashing algorithm.
- Unauthorized users cannot access app pages or API resources.
- All user-owned resources are isolated by authenticated user ID.

#### Accounts

- User can create, edit, archive, and list accounts.
- Each account has name, type, ISO 4217 currency code, opening balance, status, created timestamp, and updated timestamp.
- Account currency is required.
- Account currency cannot be changed after transactions or transfers exist for that account.
- Account balances are derived from active transactions and transfers, not treated as manually editable source-of-truth values.

#### Categories

- User can create, edit, archive, and list categories.
- Each category has name, type (`income`, `expense`, or `both`), optional color/icon, status, created timestamp, and updated timestamp.
- Transactions can only reference active categories when creating new transactions.
- Historical transactions keep their category reference even if the category is later archived.

#### Transactions

- User can create income and expense transactions for a specific account.
- Each transaction must include account, amount, ISO 4217 currency code, category, date, and type.
- Optional fields include note, merchant/payee, external reference ID, and metadata.
- Transaction amounts are stored as integer minor units, not floating point numbers.
- Transactions cannot be hard-deleted.
- Transactions may be voided for correction or audit purposes.
- Voided transactions remain visible in transaction history with status, timestamp, reason, and actor.
- Dashboard totals, account balances, and reports exclude voided transactions by default.
- Every transaction mutation records whether it was performed by a user session or API key.

#### Transfers

- User can transfer between two accounts.
- Transfer requires source account, destination account, source amount, destination amount, date, and optional exchange rate.
- Same-currency transfers may default destination amount to source amount.
- Cross-currency transfers require either explicit destination amount or explicit exchange rate.
- Transfers cannot be hard-deleted.
- Transfers may be voided using the same audit behavior as transactions.

#### Currency Conversion

- User can set a preferred base currency using an ISO 4217 currency code.
- Dashboard totals are shown in the user's base currency.
- Only ISO 4217 currencies are supported in MVP.
- Conversion rates are stored with each converted transaction or transfer for historical consistency.
- If live exchange-rate integration is not available in MVP, user can manually provide rates.

#### Dashboard

- Dashboard shows total net worth, account balances, monthly income, monthly expenses, category breakdown, and recent transactions.
- Dashboard is responsive and optimized for mobile-first use.
- Dashboard uses the user's preferred base currency for cross-account totals.
- Dashboard excludes voided transactions and transfers by default.
- Visual design remains clean and minimal, with no marketing-style landing page required for the authenticated app.

#### REST API

- API exposes versioned endpoints under `/api/v1`.
- API responses use consistent JSON envelopes and error formats.
- API supports idempotency keys for transaction and transfer creation.
- API documentation includes auth method, scopes, request examples, response examples, and error codes.
- API validates request bodies with explicit schemas.

#### API Keys

- User can create, list, revoke, and rotate API keys.
- Raw API key is shown only once at creation.
- API keys are stored hashed.
- API keys support scopes:
  - `accounts:read`
  - `categories:read`
  - `transactions:read`
  - `transactions:write`
  - `transactions:void`
  - `transfers:write`
  - `dashboard:read`
- API keys cannot access resources outside the owning user.
- API keys cannot hard-delete transactions because transaction deletion is not supported.
- `transactions:void` should be optional and excluded from default automation keys unless explicitly selected.

### Non-Goals

- No budgeting system in MVP.
- No bank sync or Plaid-style integration in MVP.
- No shared household or team accounts in MVP.
- No investment performance tracking in MVP.
- No receipt scanning or OCR in MVP.
- No AI categorization in MVP.
- No custom non-ISO currencies in MVP.
- No hard deletion of transactions or transfers.
- No double-entry accounting ledger unless later required for correctness.

## 3. AI System Requirements (If Applicable)

### Tool Requirements

Not applicable. The current product scope does not require AI models, AI tools, or model-based decisions.

### Evaluation Strategy

Not applicable. Product quality will be evaluated through functional tests, API contract tests, PWA checks, dashboard performance, and security validation.

## 4. Technical Specifications

### Architecture Overview

- **Frontend**: Next.js app with mobile-first PWA support.
- **Backend**: Next.js REST API routes under `/api/v1`.
- **Database**: MongoDB for users, accounts, categories, transactions, transfers, API keys, and exchange rates.
- **Authentication**: Email/password session authentication for web users; API-key authentication for automation.
- **Balance Model**: Balances are derived from active transactions and transfers. Cached balance summaries may be added later for performance, but transaction history remains the source of truth.

### Data Flow

1. User registers or logs in with email and password.
2. User creates accounts and categories.
3. User creates transactions manually through the PWA or programmatically through the REST API.
4. API validates authentication, ownership, scopes, request schema, currency rules, and idempotency.
5. Transactions and transfers are stored as immutable financial events unless later voided.
6. Dashboard queries aggregate account, transaction, transfer, category, and currency-converted summaries.

### Core Data Models

#### User

- `id`
- `email`
- `passwordHash`
- `baseCurrency`
- `createdAt`
- `updatedAt`

#### Account

- `id`
- `userId`
- `name`
- `type`
- `currency`
- `openingBalanceMinor`
- `status`: `active` or `archived`
- `createdAt`
- `updatedAt`

#### Category

- `id`
- `userId`
- `name`
- `type`: `income`, `expense`, or `both`
- `color`
- `icon`
- `status`: `active` or `archived`
- `createdAt`
- `updatedAt`

#### Transaction

- `id`
- `userId`
- `accountId`
- `categoryId`
- `type`: `income` or `expense`
- `amountMinor`
- `currency`
- `date`
- `note`
- `merchant`
- `externalRef`
- `metadata`
- `status`: `active` or `voided`
- `voidedAt`
- `voidedByType`: `user` or `api_key`
- `voidedById`
- `voidReason`
- `createdByType`: `user` or `api_key`
- `createdById`
- `createdAt`
- `updatedAt`

#### Transfer

- `id`
- `userId`
- `sourceAccountId`
- `destinationAccountId`
- `sourceAmountMinor`
- `sourceCurrency`
- `destinationAmountMinor`
- `destinationCurrency`
- `exchangeRate`
- `date`
- `note`
- `status`: `active` or `voided`
- `voidedAt`
- `voidedByType`: `user` or `api_key`
- `voidedById`
- `voidReason`
- `createdByType`: `user` or `api_key`
- `createdById`
- `createdAt`
- `updatedAt`

#### ApiKey

- `id`
- `userId`
- `label`
- `keyHash`
- `scopes`
- `lastUsedAt`
- `revokedAt`
- `createdAt`

#### ExchangeRate

- `id`
- `baseCurrency`
- `quoteCurrency`
- `rate`
- `source`
- `effectiveAt`
- `createdAt`

### Integration Points

#### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

#### Accounts

- `GET /api/v1/accounts`
- `POST /api/v1/accounts`
- `GET /api/v1/accounts/:id`
- `PATCH /api/v1/accounts/:id`

#### Categories

- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/:id`

#### Transactions

- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/transactions/:id`
- `PATCH /api/v1/transactions/:id`
- `POST /api/v1/transactions/:id/void`

#### Transfers

- `GET /api/v1/transfers`
- `POST /api/v1/transfers`
- `GET /api/v1/transfers/:id`
- `POST /api/v1/transfers/:id/void`

#### Dashboard

- `GET /api/v1/dashboard/summary`

#### Exchange Rates

- `GET /api/v1/exchange-rates`
- `POST /api/v1/exchange-rates`

#### API Keys

- `GET /api/v1/api-keys`
- `POST /api/v1/api-keys`
- `POST /api/v1/api-keys/:id/revoke`
- `POST /api/v1/api-keys/:id/rotate`

### Security & Privacy

- Store passwords with Argon2id, bcrypt, or another modern password hashing algorithm.
- Store API keys hashed; show raw key only once.
- Enforce authorization on every user-owned resource.
- Enforce API scopes before every API-key operation.
- Use HTTPS-only secure cookies in production.
- Validate all request bodies with schema validation.
- Rate-limit login and API-key authenticated endpoints.
- Never log raw API keys, passwords, or full financial metadata.
- Maintain audit fields for transaction and transfer creation, mutation, and voiding.
- Use idempotency keys to prevent duplicate automated transaction and transfer creation.
- Use CSRF protection for cookie-authenticated mutating requests.

## 5. Risks & Roadmap

### Phased Rollout

#### MVP

- Email/password login
- Accounts
- Categories
- Income and expense transactions
- Transfers
- Manual ISO-currency conversion support
- Mobile-first PWA shell
- Minimal dashboard
- Scoped API keys
- REST API documentation
- Transaction and transfer voiding

#### v1.1

- Exchange-rate provider integration
- Better dashboard trends and category analytics
- CSV import/export
- Transaction search and filters
- API idempotency dashboard/debug view
- Cached balance summaries for faster dashboards, with transaction-derived recalculation as source of truth

#### v2.0

- Budgets
- Recurring transactions
- Rules-based auto-categorization
- Bank-sync integrations
- Shared accounts or household mode
- Advanced reports

### Technical Risks

- **Balance correctness**: Derived balances can become expensive to calculate as data grows. Mitigation: use transaction history as source of truth and introduce cached summaries only after benchmark evidence requires it.
- **Currency accuracy**: Live exchange rates can change and make historical reports inconsistent. Mitigation: store conversion-rate snapshots on each transaction or transfer where conversion is used.
- **API automation duplicates**: External automations may retry requests. Mitigation: support idempotency keys on write endpoints.
- **Scope enforcement bugs**: API keys introduce a second auth path. Mitigation: centralize auth and scope checks in shared middleware.
- **Mobile complexity creep**: Dashboard insights can grow too broad. Mitigation: keep MVP dashboard limited to balances, monthly income/expense, category breakdown, and recent transactions.
- **MongoDB schema looseness**: Flexible documents can lead to inconsistent financial records. Mitigation: use strict application-level schemas, database indexes, and contract tests.

### Open Questions

- Should account types be fixed values such as `cash`, `bank`, `card`, `wallet`, and `other`, or user-defined?
- Should transaction categories ship with default starter categories?
- Should voiding require a reason for all users, or only for API-key initiated voids?
- Which exchange-rate source should be used in v1.1?
