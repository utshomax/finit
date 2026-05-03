import { readFileSync, existsSync } from "node:fs";
import { MongoClient } from "mongodb";

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const email = `api-flow-${runId}@example.com`;
const password = "password123";
const createdUserIds = new Set();
const checks = [];

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function record(name) {
  checks.push(name);
  console.log(`ok ${checks.length} - ${name}`);
}

class ApiClient {
  cookie = "";

  constructor(token) {
    this.token = token;
  }

  async request(method, path, body, options = {}) {
    const headers = { ...(options.headers ?? {}) };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (this.cookie) headers.cookie = this.cookie;
    if (this.token) headers.authorization = `Bearer ${this.token}`;

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(";")[0];
    }

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`${method} ${path} returned non-JSON ${response.status}: ${text.slice(0, 180)}`);
      }
    }

    return { response, payload };
  }

  async expect(method, path, body, status, name, options) {
    const result = await this.request(method, path, body, options);
    assert(result.response.status === status, `${name}: expected ${status}, got ${result.response.status}`);
    if (status >= 200 && status < 300 && status !== 204) {
      assert(result.payload?.ok === true, `${name}: expected ok response`);
    }
    if (status >= 400) {
      assert(result.payload?.ok === false, `${name}: expected error response`);
    }
    record(name);
    return result.payload?.data;
  }
}

async function cleanupByEmail(targetEmail) {
  if (!process.env.MONGODB_URI) return;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db();
    const users = await db.collection("users").find({ email: targetEmail }, { projection: { _id: 1 } }).toArray();
    const userIds = users.map((user) => user._id);
    for (const id of userIds) createdUserIds.add(id.toString());
    if (!userIds.length) return;

    await Promise.all([
      db.collection("sessions").deleteMany({ userId: { $in: userIds } }),
      db.collection("accounts").deleteMany({ userId: { $in: userIds } }),
      db.collection("categories").deleteMany({ userId: { $in: userIds } }),
      db.collection("transactions").deleteMany({ userId: { $in: userIds } }),
      db.collection("transfers").deleteMany({ userId: { $in: userIds } }),
      db.collection("api_keys").deleteMany({ userId: { $in: userIds } }),
      db.collection("users").deleteMany({ _id: { $in: userIds } }),
    ]);
  } finally {
    await client.close();
  }
}

async function main() {
  await cleanupByEmail(email);

  const anon = new ApiClient();
  await anon.expect("GET", "/api/v1/accounts", undefined, 401, "anonymous account list is rejected");
  await anon.expect(
    "POST",
    "/api/v1/accounts",
    { name: "Cash", type: "cash", currency: "USD", openingBalanceMinor: 1000 },
    401,
    "anonymous account create is rejected",
  );

  const session = new ApiClient();
  const registered = await session.expect(
    "POST",
    "/api/auth/register",
    { email, password, baseCurrency: "USD" },
    201,
    "register creates user and session",
  );
  createdUserIds.add(registered.user.id);

  await anon.expect(
    "POST",
    "/api/auth/register",
    { email, password, baseCurrency: "USD" },
    409,
    "duplicate register is rejected",
  );
  await session.expect("GET", "/api/auth/me", undefined, 200, "session current user works");

  const cash = (
    await session.expect(
      "POST",
      "/api/v1/accounts",
      { name: "Cash", type: "cash", currency: "USD", openingBalanceMinor: 10000 },
      201,
      "account create works",
    )
  ).account;
  const savings = (
    await session.expect(
      "POST",
      "/api/v1/accounts",
      { name: "Savings", type: "savings", currency: "USD", openingBalanceMinor: 50000 },
      201,
      "second account create works",
    )
  ).account;
  const euro = (
    await session.expect(
      "POST",
      "/api/v1/accounts",
      { name: "Euro Wallet", type: "wallet", currency: "EUR", openingBalanceMinor: 1000 },
      201,
      "foreign currency account create works",
    )
  ).account;
  await session.expect("GET", "/api/v1/accounts", undefined, 200, "account list works");
  await session.expect("GET", `/api/v1/accounts/${cash.id}`, undefined, 200, "account detail works");
  await session.expect(
    "PATCH",
    `/api/v1/accounts/${cash.id}`,
    { name: "Pocket Cash", openingBalanceMinor: 12000 },
    200,
    "account update works",
  );

  const salary = (
    await session.expect(
      "POST",
      "/api/v1/categories",
      { name: "Salary", type: "income" },
      201,
      "income category create works",
    )
  ).category;
  const groceries = (
    await session.expect(
      "POST",
      "/api/v1/categories",
      { name: "Groceries", type: "expense", color: "#16a34a", icon: "shopping-cart" },
      201,
      "expense category create works",
    )
  ).category;
  const misc = (
    await session.expect(
      "POST",
      "/api/v1/categories",
      { name: "Misc", type: "both" },
      201,
      "both category create works",
    )
  ).category;
  await session.expect("GET", "/api/v1/categories", undefined, 200, "category list works");
  await session.expect("GET", `/api/v1/categories/${groceries.id}`, undefined, 200, "category detail works");
  await session.expect(
    "PATCH",
    `/api/v1/categories/${groceries.id}`,
    { name: "Food", icon: "utensils" },
    200,
    "category update works",
  );

  await session.expect(
    "POST",
    "/api/v1/transactions",
    {
      accountId: cash.id,
      categoryId: salary.id,
      type: "expense",
      amountMinor: 250,
      currency: "USD",
      date: "2026-05-03T00:00:00.000Z",
    },
    400,
    "category type validation rejects mismatched transaction",
  );

  const groceryTransaction = (
    await session.expect(
      "POST",
      "/api/v1/transactions",
      {
        accountId: cash.id,
        categoryId: groceries.id,
        type: "expense",
        amountMinor: 1299,
        currency: "USD",
        date: "2026-05-03T00:00:00.000Z",
        merchant: "Market",
        metadata: { source: "integration-test" },
      },
      201,
      "transaction create works",
      { headers: { "idempotency-key": `txn-${runId}` } },
    )
  ).transaction;
  const duplicateTransaction = (
    await session.expect(
      "POST",
      "/api/v1/transactions",
      {
        accountId: cash.id,
        categoryId: groceries.id,
        type: "expense",
        amountMinor: 1299,
        currency: "USD",
        date: "2026-05-03T00:00:00.000Z",
      },
      200,
      "transaction idempotency returns existing event",
      { headers: { "idempotency-key": `txn-${runId}` } },
    )
  ).transaction;
  assert(duplicateTransaction.id === groceryTransaction.id, "idempotent transaction id mismatch");
  await session.expect(
    "POST",
    "/api/v1/transactions",
    {
      accountId: cash.id,
      categoryId: salary.id,
      type: "income",
      amountMinor: 250000,
      currency: "USD",
      date: "2026-05-03T00:00:00.000Z",
    },
    201,
    "income transaction create works",
  );
  await session.expect("GET", "/api/v1/transactions?limit=10", undefined, 200, "transaction list works");

  const unsupportedMethod = await session.request("POST", `/api/v1/accounts/${cash.id}`, { currency: "EUR" });
  assert(unsupportedMethod.response.status === 405, "unsupported method should receive 405");
  record("unsupported method receives 405");
  await session.expect(
    "PATCH",
    `/api/v1/accounts/${cash.id}`,
    { currency: "EUR" },
    409,
    "account currency change after events is rejected",
  );

  const limitedKeyData = await session.expect(
    "POST",
    "/api/v1/api-keys",
    { label: "Limited writer", scopes: ["transactions:write"] },
    201,
    "limited API key create works",
  );
  const limitedKey = limitedKeyData.apiKey;
  const limitedRawKey = limitedKeyData.rawKey;
  const fullRawKey = (
    await session.expect(
      "POST",
      "/api/v1/api-keys",
      {
        label: "Full automation",
        scopes: [
          "accounts:read",
          "categories:read",
          "transactions:read",
          "transactions:write",
          "transactions:void",
          "dashboard:read",
        ],
      },
      201,
      "full API key create works",
    )
  ).rawKey;
  await session.expect("GET", "/api/v1/api-keys", undefined, 200, "API key list works");

  const fullApi = new ApiClient(fullRawKey);
  await fullApi.expect("GET", "/api/v1/accounts", undefined, 200, "API key account read scope works");
  await fullApi.expect("GET", "/api/v1/categories", undefined, 200, "API key category read scope works");
  await fullApi.expect(
    "POST",
    "/api/v1/accounts",
    { name: "Blocked", type: "cash", currency: "USD", openingBalanceMinor: 0 },
    403,
    "API key cannot create account",
  );
  const apiTransaction = (
    await fullApi.expect(
      "POST",
      "/api/v1/transactions",
      {
        accountId: cash.id,
        categoryId: misc.id,
        type: "expense",
        amountMinor: 500,
        currency: "USD",
        date: "2026-05-03T00:00:00.000Z",
      },
      201,
      "API key transaction create works",
    )
  ).transaction;
  assert(apiTransaction.createdByType === "api_key", "API key transaction actor was not recorded");

  const limitedApi = new ApiClient(limitedRawKey);
  await limitedApi.expect("GET", "/api/v1/accounts", undefined, 403, "limited API key read is forbidden");
  await limitedApi.expect(
    "POST",
    `/api/v1/transactions/${apiTransaction.id}/void`,
    { reason: "scope check" },
    403,
    "limited API key void is forbidden",
  );
  await fullApi.expect(
    "POST",
    `/api/v1/transactions/${apiTransaction.id}/void`,
    { reason: "integration test" },
    200,
    "API key transaction void works",
  );

  const sameCurrencyTransfer = (
    await session.expect(
      "POST",
      "/api/v1/transactions",
      {
        accountId: cash.id,
        destinationAccountId: savings.id,
        type: "transfer",
        amountMinor: 2000,
        currency: "USD",
        date: "2026-05-03T00:00:00.000Z",
      },
      201,
      "same-currency transfer transaction create works",
      { headers: { "idempotency-key": `transfer-${runId}` } },
    )
  ).transaction;
  await session.expect(
    "POST",
    "/api/v1/transactions",
    {
      accountId: cash.id,
      destinationAccountId: euro.id,
      type: "transfer",
      amountMinor: 1000,
      currency: "USD",
      exchangeRate: 0.9,
      date: "2026-05-03T00:00:00.000Z",
    },
    201,
    "cross-currency transfer transaction with exchange rate works",
  );
  await fullApi.expect("GET", "/api/v1/transactions?limit=10", undefined, 200, "transaction list includes transfers");
  await fullApi.expect(
    "POST",
    `/api/v1/transactions/${sameCurrencyTransfer.id}/void`,
    { reason: "integration test" },
    200,
    "transfer transaction void works",
  );

  await session.expect("GET", "/api/v1/dashboard", undefined, 200, "session dashboard works");
  await fullApi.expect("GET", "/api/v1/dashboard", undefined, 200, "API key dashboard works");

  await session.expect("POST", `/api/v1/categories/${misc.id}/archive`, undefined, 200, "category archive works");
  await session.expect("POST", `/api/v1/accounts/${euro.id}/archive`, undefined, 200, "account archive works");

  await session.expect("POST", `/api/v1/api-keys/${limitedKey.id}/revoke`, undefined, 200, "API key revoke works");
  await limitedApi.expect(
    "POST",
    "/api/v1/transactions",
    {
      accountId: cash.id,
      categoryId: groceries.id,
      type: "expense",
      amountMinor: 100,
      currency: "USD",
      date: "2026-05-03T00:00:00.000Z",
    },
    401,
    "revoked API key is rejected",
  );

  const rotated = await session.expect(
    "POST",
    `/api/v1/api-keys/${limitedKey.id}/rotate`,
    undefined,
    200,
    "API key rotate returns new raw key",
  );
  await limitedApi.expect("GET", "/api/v1/dashboard", undefined, 401, "old rotated API key is rejected");
  const rotatedApi = new ApiClient(rotated.rawKey);
  await rotatedApi.expect(
    "POST",
    "/api/v1/transactions",
    {
      accountId: cash.id,
      categoryId: groceries.id,
      type: "expense",
      amountMinor: 101,
      currency: "USD",
      date: "2026-05-03T00:00:00.000Z",
    },
    201,
    "rotated API key works with existing scopes",
  );

  await session.expect("POST", "/api/auth/logout", undefined, 204, "logout clears session");
  await session.expect("GET", "/api/auth/me", undefined, 401, "logged out session is rejected");

  await cleanupByEmail(email);
  console.log(`\nValidated ${checks.length} API flow checks against ${baseUrl}`);
}

main().catch(async (error) => {
  await cleanupByEmail(email).catch(() => {});
  console.error(`\nAPI flow test failed: ${error.message}`);
  process.exit(1);
});
