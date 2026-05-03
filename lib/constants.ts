import { Home, WalletCards, ReceiptText, Activity, Filter, KeyRound, type LucideIcon } from "lucide-react";
import type { Tab } from "./types";

export const apiScopes = [
  "accounts:read",
  "categories:read",
  "transactions:read",
  "transactions:write",
  "transactions:void",
  "dashboard:read",
];

export const defaultDateInput = new Date().toISOString().slice(0, 10);

export const navItems: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "accounts", label: "Accounts", icon: WalletCards },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "insights", label: "Insights", icon: Activity },
  { id: "categories", label: "Categories", icon: Filter },
  { id: "api", label: "API keys", icon: KeyRound },
];

export const sampleCategories = [
  { name: "Groceries", type: "expense", color: "#111111", icon: "shopping-cart" },
  { name: "Rent", type: "expense", color: "#737373", icon: "home" },
  { name: "Transport", type: "expense", color: "#525252", icon: "train" },
  { name: "Dining", type: "expense", color: "#404040", icon: "utensils" },
  { name: "Salary", type: "income", color: "#5c8064", icon: "wallet" },
] as const;

export const sampleAccounts = [
  { name: "Monzo Current", type: "bank", currency: "GBP", openingBalanceMinor: 428415 },
  { name: "Chase Savings", type: "savings", currency: "GBP", openingBalanceMinor: 1890200 },
  { name: "Amex Platinum", type: "card", currency: "GBP", openingBalanceMinor: 0 },
] as const;

export const sampleTransactions = [
  { merchant: "Dishoom Shoreditch", type: "expense", amountMinor: 4250, note: "Dinner", category: "Dining" },
  { merchant: "TfL", type: "expense", amountMinor: 320, note: "Tube", category: "Transport" },
  { merchant: "Sainsbury's", type: "expense", amountMinor: 6482, note: "Weekly shop", category: "Groceries" },
  { merchant: "Acme Studio Ltd", type: "income", amountMinor: 342000, note: "April salary", category: "Salary" },
] as const;
