import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Account, Category, Period, Transaction } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function minorFromInput(value: FormDataEntryValue | null) {
  return Math.round(Number(value || 0) * 100);
}

export function todayIso() {
  return new Date().toISOString();
}

export function money(minor = 0, currency = "GBP", sign = false) {
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : `${currency} `;
  const prefix = minor < 0 ? "−" : sign && minor > 0 ? "+" : "";
  return `${prefix}${symbol}${Math.abs(minor / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function shortDate(value?: string) {
  if (!value) return "Today";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error?.message || `Request failed: ${response.status}`);
  }
  return payload.data as T;
}

export function accountName(accounts: Account[], id: string) {
  return accounts.find((account) => account.id === id)?.name || "Unknown account";
}

export function categoryName(categories: Category[], id?: string) {
  if (!id) return "Transfer";
  return categories.find((category) => category.id === id)?.name || "Unknown category";
}

export const PERIOD_LABELS: Record<Period, string> = {
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  this_year: "This year",
  all_time: "All time",
};

export function getPeriodBounds(period: Period): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (period === "this_month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
  }
  if (period === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  if (period === "last_3_months") {
    return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: null };
  }
  if (period === "this_year") {
    return { from: new Date(now.getFullYear(), 0, 1), to: null };
  }
  return { from: null, to: null };
}

export function filterTransactionsByPeriod(transactions: Transaction[], period: Period): Transaction[] {
  const { from, to } = getPeriodBounds(period);
  if (!from && !to) return transactions;
  return transactions.filter((txn) => {
    const d = txn.date ? new Date(txn.date) : null;
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

export function groupTransactionsByDay(transactions: Transaction[]) {
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  function dayLabel(value?: string) {
    if (!value) return "Today";
    const date = new Date(value);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return formatter.format(date);
  }

  const groups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const label = dayLabel(txn.date);
    groups.set(label, [...(groups.get(label) || []), txn]);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
    total: items.reduce((sum, txn) => {
      if (txn.type === "income") return sum + txn.amountMinor;
      if (txn.type === "expense") return sum - txn.amountMinor;
      return sum;
    }, 0),
  }));
}
