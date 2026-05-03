"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FloatingField } from "../components/ui/forms";
import { Sidebar } from "../components/layout/sidebar";
import { Topbar } from "../components/layout/topbar";
import { MobileNav } from "../components/layout/mobile-nav";
import { Overview } from "../components/flows/overview-flow";
import { AccountsFlow } from "../components/flows/accounts-flow";
import { TransactionsFlow } from "../components/flows/transactions-flow";
import { InsightsFlow } from "../components/flows/insights-flow";
import { CategoriesFlow } from "../components/flows/categories-flow";
import { ApiKeysFlow } from "../components/flows/api-keys-flow";
import { SettingsFlow } from "../components/flows/settings-flow";
import { CreateModal } from "../components/modals/create-modal";
import { TransactionDetailModal } from "../components/modals/transaction-detail-modal";
import { AccountModal } from "../components/modals/account-modal";
import { CategoryModal } from "../components/modals/category-modal";
import { sampleCategories, sampleAccounts, sampleTransactions } from "../lib/constants";
import { minorFromInput, api } from "../lib/utils";
import type { User, Account, Category, Transaction, ApiKey, Dashboard, AppData, Tab, Period } from "../lib/types";

function todayIso() {
  return new Date().toISOString();
}

export function FinitApp() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>({
    accounts: [],
    categories: [],
    transactions: [],
    apiKeys: [],
  });
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("this_month");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [rawKey, setRawKey] = useState("");
  const [createModal, setCreateModal] = useState<null | "account" | "category" | "transaction">(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  async function loadAll() {
    const [dashboard, accounts, categories, transactions, apiKeys] = await Promise.all([
      api<{ dashboard: Dashboard }>("/api/v1/dashboard"),
      api<{ accounts: Account[] }>("/api/v1/accounts"),
      api<{ categories: Category[] }>("/api/v1/categories"),
      api<{ transactions: Transaction[] }>("/api/v1/transactions"),
      api<{ apiKeys: ApiKey[] }>("/api/v1/api-keys"),
    ]);
    setData({
      dashboard: dashboard.dashboard,
      accounts: accounts.accounts,
      categories: categories.categories,
      transactions: transactions.transactions,
      apiKeys: apiKeys.apiKeys,
    });
  }

  function showToast(msg: string) {
    setMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(""), 4000);
  }

  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      if (success) showToast(success);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    async function boot() {
      setBusy(true);
      try {
        const me = await api<{ user: User }>("/api/auth/me");
        setUser(me.user);
        await loadAll();
      } catch {
        setUser(null);
      } finally {
        setBusy(false);
      }
    }
    boot();
  }, []);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const result = await api<{ user: User }>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          ...(mode === "register" ? { baseCurrency: form.get("baseCurrency") || "GBP" } : {}),
        }),
      });
      setUser(result.user);
      await loadAll();
    });
  }

  async function logout() {
    await run(async () => {
      await api<void>("/api/auth/logout", { method: "POST" });
      setUser(null);
      setData({ accounts: [], categories: [], transactions: [], apiKeys: [] });
    });
  }

  async function seedSampleData() {
    await run(async () => {
      const createdCategories: Category[] = [];
      for (const category of sampleCategories) {
        const existing = data.categories.find((item) => item.name === category.name);
        if (existing) createdCategories.push(existing);
        else {
          const result = await api<{ category: Category }>("/api/v1/categories", {
            method: "POST",
            body: JSON.stringify(category),
          });
          createdCategories.push(result.category);
        }
      }
      const createdAccounts: Account[] = [];
      for (const account of sampleAccounts) {
        const existing = data.accounts.find((item) => item.name === account.name);
        if (existing) createdAccounts.push(existing);
        else {
          const result = await api<{ account: Account }>("/api/v1/accounts", {
            method: "POST",
            body: JSON.stringify(account),
          });
          createdAccounts.push(result.account);
        }
      }
      const account = createdAccounts[0];
      for (const txn of sampleTransactions) {
        const category = createdCategories.find((item) => item.name === txn.category);
        if (!account || !category) continue;
        await api("/api/v1/transactions", {
          method: "POST",
          headers: { "Idempotency-Key": `sample-${txn.merchant.toLowerCase().replaceAll(" ", "-")}` },
          body: JSON.stringify({
            accountId: account.id,
            categoryId: category.id,
            type: txn.type,
            amountMinor: txn.amountMinor,
            currency: account.currency,
            date: todayIso(),
            merchant: txn.merchant,
            note: txn.note,
          }),
        });
      }
      await loadAll();
    }, "Sample data loaded");
  }

  const activeAccounts = data.accounts.filter((account) => account.status === "active");
  const activeCategories = data.categories.filter((category) => category.status === "active");
  const baseCurrency = data.dashboard?.baseCurrency || user?.baseCurrency || "GBP";

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      await api("/api/v1/accounts", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          type: form.get("type"),
          currency: String(form.get("currency") || "GBP").toUpperCase(),
          openingBalanceMinor: minorFromInput(form.get("openingBalance")),
        }),
      });
      setCreateModal(null);
      await loadAll();
    }, "Account created");
  }

  async function updateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = String(form.get("id"));
    await run(async () => {
      await api(`/api/v1/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          type: form.get("type"),
          currency: String(form.get("currency") || "GBP").toUpperCase(),
          openingBalanceMinor: minorFromInput(form.get("openingBalance")),
        }),
      });
      setEditAccount(null);
      await loadAll();
    }, "Account updated");
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      await api("/api/v1/categories", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          type: form.get("type"),
          color: form.get("color"),
          icon: form.get("icon"),
        }),
      });
      setCreateModal(null);
      await loadAll();
    }, "Category created");
  }

  async function updateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = String(form.get("id"));
    await run(async () => {
      await api(`/api/v1/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          type: form.get("type"),
          color: form.get("color"),
          icon: form.get("icon"),
        }),
      });
      setEditCategory(null);
      await loadAll();
    }, "Category updated");
  }

  async function createTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const account = activeAccounts.find((item) => item.id === form.get("accountId"));
    await run(async () => {
      await api("/api/v1/transactions", {
        method: "POST",
        headers: { "Idempotency-Key": `ui-${crypto.randomUUID()}` },
        body: JSON.stringify({
          accountId: form.get("accountId"),
          type: form.get("type"),
          amountMinor: minorFromInput(form.get("amount")),
          currency: account?.currency || "GBP",
          ...(form.get("type") === "transfer"
            ? {
                destinationAccountId: form.get("destinationAccountId"),
                destinationAmountMinor: minorFromInput(form.get("destinationAmount")) || undefined,
                exchangeRate: form.get("exchangeRate") ? Number(form.get("exchangeRate")) : undefined,
              }
            : {
                categoryId: form.get("categoryId"),
                merchant: form.get("merchant"),
              }),
          date: new Date(String(form.get("date") || new Date())).toISOString(),
          note: form.get("note"),
        }),
      });
      setCreateModal(null);
      await loadAll();
    }, "Transaction created");
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f0eee9] px-4 py-12 text-[#111]" style={{ minHeight: "100dvh" }}>
        <div className="w-full max-w-[400px]">
          <form onSubmit={authenticate}>
            <div className="rounded-[28px] bg-[#FAFAF7] p-8 shadow-[0_2px_0_rgba(17,17,17,0.06),0_16px_56px_rgba(17,17,17,0.09)]">
              <div className="font-serif text-[26px] italic leading-none">
                finit<span className="not-italic">.</span>
              </div>
              <h1 className="mt-7 font-serif text-[34px] leading-[1.08] tracking-[-0.02em]">
                {mode === "login" ? "Welcome back." : "Create account."}
              </h1>
              {mode === "login" && (
                <p className="mt-2 text-[14px] leading-relaxed text-black/50">
                  Track every account, transaction, and pound.
                </p>
              )}
              <div className="mt-7 grid gap-3">
                <FloatingField name="email" label="Email" type="email" defaultValue="alex@finit.app" />
                <FloatingField name="password" label="Password" type="password" defaultValue="password123" />
                {mode === "register" && <FloatingField name="baseCurrency" label="Base currency" defaultValue="GBP" />}
              </div>
              {message && (
                <p className="mt-4 rounded-xl bg-black/[0.05] px-4 py-2.5 text-[13px] text-black/65">{message}</p>
              )}
              <button disabled={busy} className="mt-5 w-full rounded-[14px] bg-[#111] px-4 py-[15px] text-[14px] font-medium text-[#FAFAF7] transition-opacity disabled:opacity-50">
                {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </div>
          </form>
          <div className="mt-5 text-center text-[13px] text-black/50">
            {mode === "login" ? (
              <>New here?{" "}<button type="button" onClick={() => setMode("register")} className="font-medium text-[#111] hover:underline underline-offset-2">Create an account</button></>
            ) : (
              <>Already have an account?{" "}<button type="button" onClick={() => setMode("login")} className="font-medium text-[#111] hover:underline underline-offset-2">Sign in</button></>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f0eee9] text-[#111111] sm:p-5" style={{ height: "100dvh" }}>
      <div className="mx-auto grid h-full w-full max-w-[1440px] overflow-hidden rounded-none border-0 bg-[#FAFAF7] sm:rounded-[22px] sm:border sm:border-black/10 sm:shadow-[0_24px_80px_rgba(17,17,17,0.12)] lg:grid-cols-[232px_1fr]">
        <Sidebar tab={tab} setTab={setTab} user={user} logout={logout} />
        <section className="flex min-w-0 flex-col overflow-hidden">
          <Topbar tab={tab} period={period} onPeriodChange={setPeriod} openTransactionModal={() => setCreateModal("transaction")} user={user} />

          <div className="flex-1 overflow-y-auto px-4 pb-24 sm:px-6 lg:px-8 lg:pb-8">
            {tab === "overview" ? (
              <Overview data={data} baseCurrency={baseCurrency} setTab={setTab} onViewTransaction={setViewTransactionId} user={user} />
            ) : tab === "accounts" ? (
              <AccountsFlow accounts={data.accounts} refresh={loadAll} run={run} onNew={() => setCreateModal("account")} onEdit={setEditAccount} />
            ) : tab === "transactions" ? (
              <TransactionsFlow transactions={data.transactions} accounts={data.accounts} categories={data.categories} refresh={loadAll} run={run} onNew={() => setCreateModal("transaction")} onViewTransaction={setViewTransactionId} />
            ) : tab === "insights" ? (
              <InsightsFlow period={period} setTab={setTab} />
            ) : tab === "categories" ? (
              <CategoriesFlow categories={data.categories} refresh={loadAll} run={run} onNew={() => setCreateModal("category")} onEdit={setEditCategory} />
            ) : tab === "api" ? (
              <ApiKeysFlow apiKeys={data.apiKeys} rawKey={rawKey} setRawKey={setRawKey} refresh={loadAll} run={run} />
            ) : (
              <SettingsFlow user={user} logout={logout} />
            )}
          </div>
        </section>
        <MobileNav tab={tab} setTab={setTab} openTransactionModal={() => setCreateModal("transaction")} />
        <TransactionDetailModal
          transactionId={viewTransactionId}
          transactions={data.transactions}
          accounts={data.accounts}
          categories={data.categories}
          onClose={() => setViewTransactionId(null)}
          refresh={loadAll}
          run={run}
        />
        <AccountModal account={editAccount} onClose={() => setEditAccount(null)} onSubmit={updateAccount} />
        <CategoryModal key={editCategory?.id ?? ""} category={editCategory} onClose={() => setEditCategory(null)} onSubmit={updateCategory} />
        <CreateModal
          type={createModal}
          accounts={activeAccounts}
          categories={activeCategories}
          onClose={() => setCreateModal(null)}
          onCreateAccount={createAccount}
          onCreateCategory={createCategory}
          onCreateTransaction={createTransaction}
        />
      </div>
      {message && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-[14px] bg-[#111] px-5 py-3.5 text-[13px] text-[#FAFAF7] shadow-[0_8px_32px_rgba(17,17,17,0.24)]">
            {message}
            <button onClick={() => setMessage("")} className="ml-1 text-white/50 transition-colors hover:text-white/90" aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
