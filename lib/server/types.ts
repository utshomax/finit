import type { ObjectId } from "mongodb";
import type {
  ACCOUNT_TYPES,
  API_SCOPES,
  CATEGORY_TYPES,
  EVENT_STATUSES,
  RESOURCE_STATUSES,
  TRANSACTION_TYPES,
} from "./constants";

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type ApiScope = (typeof API_SCOPES)[number];
export type ActorType = "user" | "api_key";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  baseCurrency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionDoc = {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export type AccountDoc = {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  type: AccountType;
  currency: string;
  openingBalanceMinor: number;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryDoc = {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type MutationActor = {
  createdByType: ActorType;
  createdById: ObjectId;
};

export type TransactionDoc = MutationActor & {
  _id: ObjectId;
  userId: ObjectId;
  accountId: ObjectId;
  categoryId?: ObjectId;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  destinationAccountId?: ObjectId;
  destinationAmountMinor?: number;
  destinationCurrency?: string;
  exchangeRate?: number;
  date: Date;
  note?: string;
  merchant?: string;
  externalRef?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  status: EventStatus;
  voidedAt?: Date;
  voidedByType?: ActorType;
  voidedById?: ObjectId;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiKeyDoc = {
  _id: ObjectId;
  userId: ObjectId;
  label: string;
  keyHash: string;
  prefix: string;
  scopes: ApiScope[];
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthActor = {
  type: ActorType;
  userId: ObjectId;
  actorId: ObjectId;
  scopes: ApiScope[];
};
