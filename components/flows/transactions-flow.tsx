"use client";

import { useState, useMemo } from "react";
import { Download, Search, ArrowRightLeft, X } from "lucide-react";
import { money, shortDate, accountName, categoryName, groupTransactionsByDay } from "../../lib/utils";
import { SelectButton } from "../ui/buttons";
import { CategoryTile } from "../ui/category-icon";
import { EmptyState } from "../ui/layout";
import { TransactionRow } from "../dashboard/rows";
import type { Transaction, Account, Category, Runner } from "../../lib/types";

export function TransactionsFlow({
  transactions,
  accounts,
  categories,
  refresh,
  run,
  onNew,
  onViewTransaction,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  refresh: () => Promise<void>;
  run: Runner;
  onNew: () => void;
  onViewTransaction: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59.999") : null;
    return transactions.filter((txn) => {
      if (accountFilter && txn.accountId !== accountFilter) return false;
      if (categoryFilter && txn.categoryId !== categoryFilter) return false;
      if (from || to) {
        const d = txn.date ? new Date(txn.date) : null;
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      if (q) {
        const haystack = [
          txn.merchant,
          txn.note,
          categoryName(categories, txn.categoryId),
          accountName(accounts, txn.accountId),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, accounts, categories, search, accountFilter, categoryFilter, dateFrom, dateTo]);

  const grouped = groupTransactionsByDay(filtered);

  const transactionTitle = (txn: Transaction) =>
    txn.type === "transfer" ? "Transfer" : txn.merchant || "Transaction";
  const transactionAccount = (txn: Transaction) =>
    txn.type === "transfer"
      ? `${accountName(accounts, txn.accountId)} → ${accountName(accounts, txn.destinationAccountId || "")}`
      : accountName(accounts, txn.accountId);
  const transactionAmount = (txn: Transaction) => {
    if (txn.type === "income") return money(txn.amountMinor, txn.currency, true);
    if (txn.type === "expense") return money(-txn.amountMinor, txn.currency);
    return `${money(-txn.amountMinor, txn.currency)}${txn.destinationAmountMinor ? ` / ${money(txn.destinationAmountMinor, txn.destinationCurrency || txn.currency, true)}` : ""}`;
  };
  const amountClass = (txn: Transaction) =>
    txn.type === "income" ? "text-[#5c8064]" : txn.type === "transfer" ? "text-black/65" : "";

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const activeCategories = categories.filter((c) => c.status === "active");
  const hasFilters = search || accountFilter || categoryFilter || dateFrom || dateTo;

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-black/10 bg-white">
        {/* Filter bar */}
        <div className="grid gap-2 border-b border-black/10 p-3 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-black/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchants, notes…"
              className="w-full rounded-lg border border-black/10 bg-[#FAFAF7] py-2 pl-8 pr-8 text-xs text-black/80 placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-black/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 text-black/35 hover:text-black/60">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black/20 ${dateFrom ? "border-black/30 bg-[#111] text-[#FAFAF7] [color-scheme:dark]" : "border-black/10 bg-[#FAFAF7] text-black/65"}`}
          />

          {/* Date to */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black/20 ${dateTo ? "border-black/30 bg-[#111] text-[#FAFAF7] [color-scheme:dark]" : "border-black/10 bg-[#FAFAF7] text-black/65"}`}
          />

          {/* Account filter */}
          <SelectButton
            value={accountFilter}
            onChange={setAccountFilter}
            active={!!accountFilter}
          >
            <option value="">All accounts</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </SelectButton>

          {/* Category filter */}
          <SelectButton
            value={categoryFilter}
            onChange={setCategoryFilter}
            active={!!categoryFilter}
          >
            <option value="">All categories</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectButton>

          {/* Export */}
          <button className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black/65">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        {/* Active filter summary */}
        {hasFilters && (
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-2">
            <span className="text-[11px] text-black/50">
              {filtered.length} of {transactions.length} transactions
            </span>
            <button
              onClick={() => { setSearch(""); setAccountFilter(""); setCategoryFilter(""); setDateFrom(""); setDateTo(""); }}
              className="text-[11px] text-black/50 underline underline-offset-2 hover:text-black/70"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden overflow-hidden lg:block">
          <div className="grid grid-cols-[86px_1.35fr_0.8fr_0.95fr_1fr_0.75fr_72px] border-b border-black/10 px-5 py-3 text-[10px] uppercase tracking-[0.08em] text-black/45">
            <div>Date</div><div>Merchant</div><div>Category</div><div>Account</div><div>Note</div><div className="text-right">Amount</div><div></div>
          </div>
          {filtered.length ? filtered.map((txn) => (
            <button
              key={txn.id}
              onClick={() => onViewTransaction(txn.id)}
              className="grid grid-cols-[86px_1.35fr_0.8fr_0.95fr_1fr_0.75fr_72px] items-center w-full border-b border-black/[0.07] px-5 py-3 text-left text-[12px] last:border-b-0 transition-colors hover:bg-black/[0.02]"
            >
              <div className="text-black/55 tabular-nums">{shortDate(txn.date)}</div>
              <div className="flex min-w-0 items-center gap-3">
                <CategoryTile
                  category={txn.type === "transfer" ? null : categories.find((c) => c.id === txn.categoryId)}
                  size="sm"
                />
                <span className="truncate font-medium">{transactionTitle(txn)}</span>
              </div>
              <div className="truncate text-black/65">{txn.type === "transfer" ? "Transfer" : categoryName(categories, txn.categoryId)}</div>
              <div className="truncate text-black/65">{transactionAccount(txn)}</div>
              <div className="truncate text-black/50">{txn.note || "-"}</div>
              <div className={`text-right font-medium tabular-nums ${amountClass(txn)}`}>{transactionAmount(txn)}</div>
              <div className="text-right">
                {txn.status === "active"
                  ? <span className="text-[11px] text-black/40">Active</span>
                  : <span className="text-[11px] text-black/40">Voided</span>}
              </div>
            </button>
          )) : <EmptyState text={hasFilters ? "No transactions match your filters." : "No transactions yet."} />}
        </div>

        {/* Mobile grouped list */}
        <div className="grid gap-4 p-4 lg:hidden">
          {grouped.length ? grouped.map(({ label, total, items }) => (
            <div key={label}>
              <div className="mb-1 flex items-baseline justify-between px-1 text-[11px] uppercase tracking-[0.08em] text-black/50">
                <span>{label}</span>
                <span className="tabular-nums">{money(total, items[0]?.currency || "GBP", total > 0)}</span>
              </div>
              <div className="divide-y divide-black/10">
                {items.map((txn) => (
                  <TransactionRow key={txn.id} txn={txn} accounts={accounts} categories={categories} onClick={() => onViewTransaction(txn.id)} />
                ))}
              </div>
            </div>
          )) : <EmptyState text={hasFilters ? "No transactions match your filters." : "No transactions yet."} />}
        </div>
      </section>
    </div>
  );
}
