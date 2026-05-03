export const SESSION_COOKIE_NAME = "finit_session";

export const ACCOUNT_TYPES = [
  "cash",
  "bank",
  "card",
  "wallet",
  "savings",
  "loan",
  "other",
] as const;

export const CATEGORY_TYPES = ["income", "expense", "both"] as const;
export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;
export const RESOURCE_STATUSES = ["active", "archived"] as const;
export const EVENT_STATUSES = ["active", "voided"] as const;

export const API_SCOPES = [
  "accounts:read",
  "categories:read",
  "transactions:read",
  "transactions:write",
  "transactions:void",
  "dashboard:read",
] as const;

export const WRITE_API_SCOPES = [
  "transactions:write",
] as const;

export const DEFAULT_BASE_CURRENCY = "USD";

export const ISO_CURRENCY_RE = /^[A-Z]{3}$/;
