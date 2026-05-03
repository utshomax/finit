import { ApiError } from "./http";
import {
  ACCOUNT_TYPES,
  API_SCOPES,
  CATEGORY_TYPES,
  ISO_CURRENCY_RE,
  TRANSACTION_TYPES,
} from "./constants";
import type { AccountType, ApiScope, CategoryType, TransactionType } from "./types";

export function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "validation_error", "Request body must be an object");
  }
  return value as Record<string, unknown>;
}

export function stringField(body: Record<string, unknown>, key: string, options: { optional: true; max?: number }): string | undefined;
export function stringField(body: Record<string, unknown>, key: string, options?: { optional?: false; max?: number }): string;
export function stringField(body: Record<string, unknown>, key: string, options?: { optional?: boolean; max?: number }) {
  const value = body[key];
  if (value == null && options?.optional) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "validation_error", `${key} is required`);
  }
  const trimmed = value.trim();
  if (options?.max && trimmed.length > options.max) {
    throw new ApiError(400, "validation_error", `${key} must be ${options.max} characters or less`);
  }
  return trimmed;
}

export function optionalString(body: Record<string, unknown>, key: string, max = 500) {
  return stringField(body, key, { optional: true, max });
}

export function integerField(body: Record<string, unknown>, key: string, options: { min?: number; optional: true }): number | undefined;
export function integerField(body: Record<string, unknown>, key: string, options?: { min?: number; optional?: false }): number;
export function integerField(body: Record<string, unknown>, key: string, options?: { min?: number; optional?: boolean }) {
  const value = body[key];
  if (value == null && options?.optional) return undefined;
  if (!Number.isInteger(value)) {
    throw new ApiError(400, "validation_error", `${key} must be an integer`);
  }
  const numberValue = value as number;
  if (options?.min != null && numberValue < options.min) {
    throw new ApiError(400, "validation_error", `${key} must be at least ${options.min}`);
  }
  return numberValue;
}

export function numberField(body: Record<string, unknown>, key: string, options: { min?: number; optional: true }): number | undefined;
export function numberField(body: Record<string, unknown>, key: string, options?: { min?: number; optional?: false }): number;
export function numberField(body: Record<string, unknown>, key: string, options?: { min?: number; optional?: boolean }) {
  const value = body[key];
  if (value == null && options?.optional) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ApiError(400, "validation_error", `${key} must be a number`);
  }
  const numberValue = value;
  if (options?.min != null && numberValue < options.min) {
    throw new ApiError(400, "validation_error", `${key} must be at least ${options.min}`);
  }
  return numberValue;
}

export function currencyField(body: Record<string, unknown>, key = "currency") {
  const value = stringField(body, key).toUpperCase();
  if (!ISO_CURRENCY_RE.test(value)) {
    throw new ApiError(400, "validation_error", `${key} must be an ISO 4217 currency code`);
  }
  return value;
}

export function optionalCurrency(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (value == null) return undefined;
  return currencyField(body, key);
}

export function enumField<T extends string>(body: Record<string, unknown>, key: string, allowed: readonly T[]) {
  const value = stringField(body, key);
  if (!allowed.includes(value as T)) {
    throw new ApiError(400, "validation_error", `${key} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function accountTypeField(body: Record<string, unknown>, key = "type"): AccountType {
  return enumField(body, key, ACCOUNT_TYPES);
}

export function categoryTypeField(body: Record<string, unknown>, key = "type"): CategoryType {
  return enumField(body, key, CATEGORY_TYPES);
}

export function transactionTypeField(body: Record<string, unknown>, key = "type"): TransactionType {
  return enumField(body, key, TRANSACTION_TYPES);
}

export function dateField(body: Record<string, unknown>, key = "date") {
  const value = stringField(body, key);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "validation_error", `${key} must be a valid date`);
  }
  return date;
}

export function metadataField(body: Record<string, unknown>) {
  const value = body.metadata;
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "validation_error", "metadata must be an object");
  }
  return value as Record<string, unknown>;
}

export function scopesField(body: Record<string, unknown>) {
  const value = body.scopes;
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, "validation_error", "scopes must be a non-empty array");
  }
  const scopes = [...new Set(value)];
  for (const scope of scopes) {
    if (typeof scope !== "string" || !API_SCOPES.includes(scope as ApiScope)) {
      throw new ApiError(400, "validation_error", `Invalid API scope: ${String(scope)}`);
    }
  }
  return scopes as ApiScope[];
}
