import { Activity, ArrowRightLeft } from "lucide-react";
import { money, categoryName, accountName } from "../../lib/utils";
import { IconTile } from "../ui/buttons";
import { CategoryTile } from "../ui/category-icon";
import type { Transaction, Account, Category } from "../../lib/types";
import type { ReactNode } from "react";

export function TransactionRow({ txn, accounts, categories, onClick }: { txn: Transaction; accounts: Account[]; categories: Category[]; onClick?: () => void }) {
  const isTransfer = txn.type === "transfer";
  const title = isTransfer ? "Transfer" : txn.merchant || txn.note || "Transaction";
  const subtitle = isTransfer
    ? `${accountName(accounts, txn.accountId)} → ${accountName(accounts, txn.destinationAccountId || "")}`
    : `${categoryName(categories, txn.categoryId)} · ${accountName(accounts, txn.accountId)}`;
  const amount = txn.type === "income"
    ? money(txn.amountMinor, txn.currency, true)
    : txn.type === "expense"
      ? money(-txn.amountMinor, txn.currency)
      : money(-txn.amountMinor, txn.currency);
  const category = isTransfer ? null : categories.find((c) => c.id === txn.categoryId);
  return (
    <button onClick={onClick} className="w-full grid grid-cols-[34px_1fr_auto] items-center gap-3 py-3 text-left hover:bg-black/[0.02] transition-colors rounded-lg px-2 -mx-2">
      <CategoryTile category={category} />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">{title}</div>
        <div className="truncate text-[11px] text-black/50">{subtitle}</div>
      </div>
      <div className={`text-right text-sm tabular-nums ${txn.type === "income" ? "text-[#5c8064]" : ""}`}>{amount}</div>
    </button>
  );
}

export function ActionRow({ title, sub, amount, swatch, children }: { title: string; sub?: string; amount?: string; swatch?: string; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {swatch ? <span className="h-3 w-3 rounded-full" style={{ background: swatch }} /> : null}
          <div className="truncate text-sm font-medium">{title}</div>
        </div>
        {sub ? <div className="mt-1 text-xs text-black/50">{sub}</div> : null}
      </div>
      <div className="flex items-center gap-2">
        {amount ? <span className="text-sm tabular-nums">{amount}</span> : null}
        {children}
      </div>
    </div>
  );
}

export function ProgressRow({ label, value, pct, index }: { label: string; value: string; pct: number; index: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-black/65"><span>{label}</span><span className="tabular-nums">{value}</span></div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: `rgba(17,17,17,${0.9 - index * 0.1})` }} /></div>
    </div>
  );
}

export function SignalRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid grid-cols-[34px_1fr] gap-3 rounded-xl bg-black/[0.035] p-3">
      <IconTile><Activity className="h-4 w-4" /></IconTile>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs leading-5 text-black/55">{detail}</div>
      </div>
    </div>
  );
}

export function SettingsRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-[13px]">
      <div className="text-black/45">{icon}</div>
      <div className="flex-1 text-black/65">{label}</div>
      <div className="font-medium text-[#111]">{value}</div>
    </div>
  );
}
