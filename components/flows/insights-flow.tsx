"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, ReceiptText, CalendarDays, Layers } from "lucide-react";
import { api, money, PERIOD_LABELS, shortDate } from "../../lib/utils";
import { Panel } from "../ui/layout";
import type { Insights, Period, Tab } from "../../lib/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function delta(current: number, previous: number) {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function DeltaBadge({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return null;
  const positive = invert ? pct < 0 : pct > 0;
  const neutral = pct === 0;
  const Icon = neutral ? Minus : positive ? TrendingUp : TrendingDown;
  const cls = neutral
    ? "bg-black/[0.06] text-black/50"
    : positive
      ? "bg-[#eaf2ec] text-[#3a6644]"
      : "bg-red-50 text-red-600";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${cls}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}%
    </span>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  pct,
  invertDelta,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  pct?: number | null;
  invertDelta?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-black/10 bg-white p-5">
      <div className="text-[11px] uppercase tracking-[0.08em] text-black/45">{label}</div>
      <div className={`mt-2 font-serif text-3xl leading-none tracking-[-0.01em] ${accent ? "text-[#5c8064]" : ""}`}>
        {value}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[12px] text-black/50">{sub}</span>
        {pct !== undefined && <DeltaBadge pct={pct ?? null} invert={invertDelta} />}
      </div>
    </div>
  );
}

function TrendChart({ data, currency }: { data: Insights["monthlyTrend"]; currency: string }) {
  const maxVal = Math.max(...data.flatMap((m) => [m.incomeMinor, m.expenseMinor]), 1);
  return (
    <div className="mt-5">
      <div className="flex items-end gap-1.5 h-36">
        {data.map((m) => {
          const incH = Math.round((m.incomeMinor / maxVal) * 100);
          const expH = Math.round((m.expenseMinor / maxVal) * 100);
          return (
            <div key={`${m.year}-${m.month}`} className="group flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end gap-0.5 h-28 px-0.5">
                <div
                  className="flex-1 rounded-t-sm bg-[#5c8064]/30 transition-all group-hover:bg-[#5c8064]/50"
                  style={{ height: `${incH}%` }}
                  title={`Income: ${money(m.incomeMinor, currency)}`}
                />
                <div
                  className="flex-1 rounded-t-sm bg-black/15 transition-all group-hover:bg-black/25"
                  style={{ height: `${expH}%` }}
                  title={`Expenses: ${money(m.expenseMinor, currency)}`}
                />
              </div>
              <span className="text-[10px] text-black/40">{m.month}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-black/50">
          <span className="h-2 w-2 rounded-full bg-[#5c8064]/50" />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-black/50">
          <span className="h-2 w-2 rounded-full bg-black/20" />
          Expenses
        </span>
      </div>
    </div>
  );
}

function CategoryChart({ data, currency }: { data: Insights["categoryBreakdown"]; currency: string }) {
  if (!data.length) {
    return <p className="mt-4 rounded-xl bg-black/[0.04] p-4 text-sm text-black/50">No expense data yet.</p>;
  }
  const max = data[0].amountMinor;
  const FALLBACK_COLORS = [
    "#7c9e87", "#a8c5b5", "#4a7c59", "#c8ddd1",
    "#8fae99", "#6b9478", "#b5cfc0", "#3d6b4a",
  ];
  return (
    <div className="mt-5 space-y-3">
      {data.map((cat, i) => {
        const barColor = cat.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
        const barPct = Math.round((cat.amountMinor / max) * 100);
        return (
          <div key={cat.categoryId}>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: barColor }} />
                <span className="truncate text-[13px] font-medium">{cat.name}</span>
                <span className="text-[11px] text-black/40 tabular-nums">{cat.share}%</span>
              </div>
              <span className="ml-3 flex-shrink-0 text-[13px] tabular-nums text-black/70">
                {money(-cat.amountMinor, cat.currency)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${barPct}%`, background: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopTransactions({ data, currency }: { data: Insights["topTransactions"]; currency: string }) {
  if (!data.length) {
    return <p className="mt-4 rounded-xl bg-black/[0.04] p-4 text-sm text-black/50">No transactions yet.</p>;
  }
  const max = data[0].amountMinor;
  return (
    <div className="mt-4 divide-y divide-black/[0.06]">
      {data.map((txn) => {
        const label = txn.merchant || txn.note || "Transaction";
        const barPct = Math.round((txn.amountMinor / max) * 100);
        return (
          <div key={txn.id} className="py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-black/[0.05]">
                  <ReceiptText className="h-3.5 w-3.5 text-black/40" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{label}</div>
                  <div className="text-[11px] text-black/45">
                    {txn.categoryName ?? "—"}
                    {txn.date ? ` · ${shortDate(txn.date)}` : ""}
                  </div>
                </div>
              </div>
              <span className="flex-shrink-0 text-[14px] tabular-nums font-medium">
                {money(-txn.amountMinor, txn.currency)}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.05]">
              <div className="h-full rounded-full bg-black/20 transition-all duration-500" style={{ width: `${barPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalItem({ icon: Icon, title, detail, positive }: { icon: React.ElementType; title: string; detail: string; positive?: boolean }) {
  return (
    <div className="flex gap-3 rounded-xl bg-black/[0.035] p-3.5">
      <div className={`mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg ${positive ? "bg-[#eaf2ec]" : "bg-black/[0.06]"}`}>
        <Icon className={`h-3.5 w-3.5 ${positive ? "text-[#3a6644]" : "text-black/50"}`} />
      </div>
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="mt-0.5 text-[12px] leading-5 text-black/55">{detail}</div>
      </div>
    </div>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-3/5 rounded-xl bg-black/[0.06]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-[20px] bg-black/[0.06]" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-64 rounded-[20px] bg-black/[0.06]" />
        <div className="h-64 rounded-[20px] bg-black/[0.06]" />
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function InsightsFlow({
  period,
  setTab,
}: {
  period: Period;
  setTab: (tab: Tab) => void;
}) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api<{ insights: Insights }>(`/api/v1/insights?period=${period}`)
      .then((res) => { setInsights(res.insights); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [period]);

  if (loading) return <Skeleton />;
  if (error || !insights) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
        {error ?? "Failed to load insights."}
      </div>
    );
  }

  const { summary, categoryBreakdown, monthlyTrend, topTransactions, vsPrevious, baseCurrency } = insights;
  const periodLabel = PERIOD_LABELS[period];
  const saved = summary.savedMinor;
  const isUp = saved >= 0;
  // Hero shows gross expenses when in deficit so it matches the Expenses card
  const heroAmount = isUp ? saved : summary.expenseMinor;

  const expDelta = vsPrevious ? delta(summary.expenseMinor, vsPrevious.expenseMinor) : null;
  const incDelta = vsPrevious ? delta(summary.incomeMinor, vsPrevious.incomeMinor) : null;
  const savDelta = vsPrevious ? delta(summary.savedMinor, vsPrevious.savedMinor) : null;

  // Signals derived from data
  const signals: { icon: React.ElementType; title: string; detail: string; positive?: boolean }[] = [];

  if (summary.savingsRate >= 20) {
    signals.push({ icon: TrendingUp, title: "Healthy savings rate", detail: `${summary.savingsRate}% of income saved — above the recommended 20% threshold.`, positive: true });
  } else if (summary.savingsRate > 0) {
    signals.push({ icon: TrendingDown, title: "Savings rate below target", detail: `${summary.savingsRate}% saved this period. Aim for 20% or more to build a cushion.` });
  }

  if (categoryBreakdown.length > 0 && categoryBreakdown[0].share > 40) {
    signals.push({ icon: Layers, title: "Spending is concentrated", detail: `${categoryBreakdown[0].name} accounts for ${categoryBreakdown[0].share}% of all expenses — consider reviewing this category.` });
  }

  if (expDelta !== null) {
    const dir = expDelta < 0 ? "down" : "up";
    const sign = expDelta < 0;
    signals.push({ icon: sign ? TrendingDown : TrendingUp, title: `Spending ${dir} vs last period`, detail: `Expenses moved ${Math.abs(expDelta)}% compared to the previous equivalent period.`, positive: sign });
  }

  if (incDelta !== null && incDelta > 0) {
    signals.push({ icon: TrendingUp, title: "Income grew this period", detail: `Up ${incDelta}% vs the previous equivalent period.`, positive: true });
  }

  if (summary.txnCount > 0 && signals.length < 4) {
    signals.push({ icon: CalendarDays, title: "Daily average tracked", detail: `${money(summary.dailyAvgExpenseMinor, baseCurrency)} per day in expenses — helps forecast monthly outflows.` });
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div>
        <h2 className="font-serif text-4xl leading-tight tracking-[-0.01em]">
          {isUp ? "You saved " : "You spent "}
          <span className={isUp ? "text-[#5c8064]" : "text-black/70"}>
            {money(Math.abs(heroAmount), baseCurrency)}
          </span>{" "}
          {periodLabel.toLowerCase()}.
        </h2>
        {vsPrevious && savDelta !== null && (
          <div className="mt-2 flex items-center gap-2 text-[13px] text-black/50">
            vs previous period
            <DeltaBadge pct={savDelta} />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Income"
          value={money(summary.incomeMinor, baseCurrency)}
          sub={`${summary.incomeTxnCount} transaction${summary.incomeTxnCount !== 1 ? "s" : ""}`}
          pct={incDelta}
          accent
        />
        <SummaryCard
          label="Expenses"
          value={money(-summary.expenseMinor, baseCurrency)}
          sub={`avg ${money(summary.avgExpenseMinor, baseCurrency)} each`}
          pct={expDelta}
          invertDelta
        />
        <SummaryCard
          label="Savings rate"
          value={`${summary.savingsRate}%`}
          sub="of income retained"
          pct={savDelta}
          accent={summary.savingsRate >= 20}
        />
        <SummaryCard
          label="Daily average"
          value={money(summary.dailyAvgExpenseMinor, baseCurrency)}
          sub="in spending per day"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Monthly cashflow" action="View transactions" onAction={() => setTab("transactions")}>
          <TrendChart data={monthlyTrend} currency={baseCurrency} />
        </Panel>
        <Panel title="Spending by category" action="Manage categories" onAction={() => setTab("categories")}>
          <CategoryChart data={categoryBreakdown} currency={baseCurrency} />
        </Panel>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Top expenses" action="View all" onAction={() => setTab("transactions")}>
          <TopTransactions data={topTransactions} currency={baseCurrency} />
        </Panel>
        <Panel title="Signals">
          <div className="mt-4 space-y-2.5">
            {signals.length === 0 ? (
              <p className="rounded-xl bg-black/[0.04] p-4 text-sm text-black/50">
                Add more transactions to generate signals.
              </p>
            ) : (
              signals.map((s, i) => (
                <SignalItem key={i} icon={s.icon} title={s.title} detail={s.detail} positive={s.positive} />
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
