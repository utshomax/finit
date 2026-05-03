import type { ObjectId } from "mongodb";
import type { AccountDoc, ApiKeyDoc, CategoryDoc, TransactionDoc, UserDoc } from "./types";

function id(value: ObjectId) {
  return value.toString();
}

function iso(value?: Date) {
  return value?.toISOString();
}

export function serializeUser(user: UserDoc) {
  return {
    id: id(user._id),
    email: user.email,
    baseCurrency: user.baseCurrency,
    createdAt: iso(user.createdAt),
    updatedAt: iso(user.updatedAt),
  };
}

export function serializeAccount(account: AccountDoc, balanceMinor?: number) {
  return {
    id: id(account._id),
    name: account.name,
    type: account.type,
    currency: account.currency,
    openingBalanceMinor: account.openingBalanceMinor,
    balanceMinor,
    status: account.status,
    createdAt: iso(account.createdAt),
    updatedAt: iso(account.updatedAt),
  };
}

export function serializeCategory(category: CategoryDoc) {
  return {
    id: id(category._id),
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    status: category.status,
    createdAt: iso(category.createdAt),
    updatedAt: iso(category.updatedAt),
  };
}

export function serializeTransaction(transaction: TransactionDoc) {
  return {
    id: id(transaction._id),
    accountId: id(transaction.accountId),
    categoryId: transaction.categoryId?.toString(),
    type: transaction.type,
    amountMinor: transaction.amountMinor,
    currency: transaction.currency,
    destinationAccountId: transaction.destinationAccountId?.toString(),
    destinationAmountMinor: transaction.destinationAmountMinor,
    destinationCurrency: transaction.destinationCurrency,
    exchangeRate: transaction.exchangeRate,
    date: iso(transaction.date),
    note: transaction.note,
    merchant: transaction.merchant,
    externalRef: transaction.externalRef,
    metadata: transaction.metadata,
    status: transaction.status,
    voidedAt: iso(transaction.voidedAt),
    voidedByType: transaction.voidedByType,
    voidedById: transaction.voidedById?.toString(),
    voidReason: transaction.voidReason,
    createdByType: transaction.createdByType,
    createdById: id(transaction.createdById),
    createdAt: iso(transaction.createdAt),
    updatedAt: iso(transaction.updatedAt),
  };
}

export function serializeApiKey(apiKey: ApiKeyDoc) {
  return {
    id: id(apiKey._id),
    label: apiKey.label,
    prefix: apiKey.prefix,
    scopes: apiKey.scopes,
    lastUsedAt: iso(apiKey.lastUsedAt),
    revokedAt: iso(apiKey.revokedAt),
    createdAt: iso(apiKey.createdAt),
    updatedAt: iso(apiKey.updatedAt),
  };
}
