import { Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type {
  AccountDoc,
  ApiKeyDoc,
  CategoryDoc,
  SessionDoc,
  TransactionDoc,
  UserDoc,
} from "./types";

let indexPromise: Promise<void> | null = null;

export async function getDb(): Promise<Db> {
  if (!clientPromise) {
    throw new Error("MONGODB_URI is not configured");
  }

  const client = await clientPromise;
  const db = client.db();

  if (!indexPromise) {
    indexPromise = ensureIndexes(db);
  }
  await indexPromise;

  return db;
}

export async function collections() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    sessions: db.collection<SessionDoc>("sessions"),
    accounts: db.collection<AccountDoc>("accounts"),
    categories: db.collection<CategoryDoc>("categories"),
    transactions: db.collection<TransactionDoc>("transactions"),
    apiKeys: db.collection<ApiKeyDoc>("api_keys"),
  };
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("accounts").createIndex({ userId: 1, status: 1 }),
    db.collection("categories").createIndex({ userId: 1, status: 1, type: 1 }),
    db.collection("transactions").createIndex({ userId: 1, date: -1 }),
    db.collection("transactions").createIndex({ userId: 1, accountId: 1, status: 1 }),
    db.collection("transactions").createIndex({ userId: 1, categoryId: 1 }),
    db.collection("transactions").createIndex({ userId: 1, destinationAccountId: 1, status: 1 }),
    db.collection("transactions").createIndex(
      { userId: 1, idempotencyKey: 1 },
      {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $exists: true } },
      },
    ),
    db.collection("api_keys").createIndex({ keyHash: 1 }, { unique: true }),
    db.collection("api_keys").createIndex({ userId: 1, revokedAt: 1 }),
  ]);
}
