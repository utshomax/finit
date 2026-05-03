import { money, shortDate } from "../../lib/utils";
import { Sparkline } from "../ui/sparkline";
import { Panel, Rows } from "../ui/layout";
import { TransactionRow } from "../dashboard/rows";
import type { AppData, Tab } from "../../lib/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit",
  investment: "Investment",
  cash: "Cash",
  loan: "Loan",
};

export function Overview({
  data,
  baseCurrency,
  setTab,
  onViewTransaction,
  user,
}: {
  data: AppData;
  baseCurrency: string;
  setTab: (tab: Tab) => void;
  onViewTransaction: (id: string) => void;
  user?: { email: string } | null;
}) {
  const firstName = user
    ? user.email.split("@")[0].replace(/^./, (c) => c.toUpperCase())
    : null;
  const accounts = data.dashboard?.accounts ?? data.accounts;
  const netWorth =
    data.dashboard?.netWorthMinor ??
    accounts.reduce((sum, a) => sum + (a.balanceMinor ?? a.openingBalanceMinor), 0);

  const recent = (data.dashboard?.recentTransactions ?? data.transactions).slice(0, 8);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="grid gap-4">
      {/* Mobile-only greeting (desktop uses topbar) */}
      {firstName && (
        <div className="lg:hidden">
          <div className="text-[11px] uppercase tracking-[0.08em] text-black/45">
            {today}
          </div>
          <h1 className="mt-1 font-serif text-3xl leading-tight tracking-[-0.01em]">
            {getGreeting()}, {firstName}.
          </h1>
        </div>
      )}
      {/* Net worth hero */}
      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">Net worth</div>
        <div className="mt-2 font-serif text-5xl leading-none tracking-[-0.01em] sm:text-6xl lg:text-[64px]">
          {money(netWorth, baseCurrency)}
        </div>
        <div className="mt-2 text-[13px] text-black/45">
          across {accounts.length} account{accounts.length !== 1 ? "s" : ""} · {today}
        </div>
        <Sparkline className="mt-6 h-20" muted />
      </section>

      {/* Account balances */}
      {accounts.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between px-0.5">
            <h2 className="font-serif text-2xl tracking-[-0.01em]">Accounts</h2>
            <button
              onClick={() => setTab("accounts")}
              className="text-xs text-black/50 hover:text-black/70"
            >
              Manage
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => {
              const balance = account.balanceMinor ?? account.openingBalanceMinor;
              const isNegative = balance < 0;
              return (
                <div
                  key={account.id}
                  className="rounded-[20px] border border-black/10 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium">{account.name}</div>
                      <div className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-black/40">
                        {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
                      </div>
                    </div>
                    {account.status === "archived" && (
                      <span className="flex-shrink-0 rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] text-black/40">
                        Archived
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-4 font-serif text-2xl leading-none tracking-[-0.01em] ${isNegative ? "text-red-500" : ""}`}
                  >
                    {money(balance, account.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <Panel title="Recent activity" action="See all" onAction={() => setTab("transactions")}>
        <Rows empty="No transactions yet. Add one from the Transactions tab.">
          {recent.map((txn) => (
            <TransactionRow
              key={txn.id}
              txn={txn}
              accounts={data.accounts}
              categories={data.categories}
              onClick={() => onViewTransaction(txn.id)}
            />
          ))}
        </Rows>
      </Panel>
    </div>
  );
}
