import { Activity, CalendarDays, WalletCards, ArrowRightLeft, FileText, Tag } from "lucide-react";
import { money, shortDate, accountName, categoryName, api } from "../../lib/utils";
import { SettingsRow } from "../dashboard/rows";
import { CategoryTile } from "../ui/category-icon";
import type { Transaction, Account, Category, Runner } from "../../lib/types";

export function TransactionDetailModal({
  transactionId,
  transactions,
  accounts,
  categories,
  onClose,
  refresh,
  run,
}: {
  transactionId: string | null;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  refresh: () => Promise<void>;
  run: Runner;
}) {
  if (!transactionId) return null;
  const txn = transactions.find((t) => t.id === transactionId);
  if (!txn) return null;
  const isTransfer = txn.type === "transfer";
  const category = isTransfer ? null : categories.find((c) => c.id === txn.categoryId);
  const amount = txn.type === "income"
    ? money(txn.amountMinor, txn.currency, true)
    : txn.type === "expense"
      ? money(-txn.amountMinor, txn.currency)
      : `${money(-txn.amountMinor, txn.currency)}${txn.destinationAmountMinor ? ` / ${money(txn.destinationAmountMinor, txn.destinationCurrency || txn.currency, true)}` : ""}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/35" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-auto rounded-t-[20px] bg-[#FAFAF7] px-5 pb-8 pt-3 shadow-[0_-16px_40px_rgba(0,0,0,0.18)] sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-[20px] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/10 sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">Details</div>
          <button onClick={onClose} className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] text-black/60">Close</button>
        </div>

        <div className="py-8 text-center">
          <div className="mx-auto mb-4 inline-flex">
            <CategoryTile category={category} size="lg" />
          </div>
          <div className="font-serif text-[48px] leading-none tracking-[-0.02em] text-[#111]">
            {amount}
          </div>
          <div className="mt-2 text-[15px] font-medium">{isTransfer ? "Transfer" : txn.merchant || "Transaction"}</div>
        </div>

        <div className="divide-y divide-black/10 rounded-[14px] border border-black/10 bg-white">
          <SettingsRow icon={<Activity className="h-4 w-4" />} label="Status" value={txn.status === "active" ? "Active" : "Voided"} />
          <SettingsRow icon={<CalendarDays className="h-4 w-4" />} label="Date" value={shortDate(txn.date)} />
          <SettingsRow icon={<WalletCards className="h-4 w-4" />} label={isTransfer ? "From" : "Account"} value={accountName(accounts, txn.accountId)} />
          {isTransfer && txn.destinationAccountId ? <SettingsRow icon={<ArrowRightLeft className="h-4 w-4" />} label="To" value={accountName(accounts, txn.destinationAccountId)} /> : null}
          {!isTransfer ? <SettingsRow icon={<Tag className="h-4 w-4" />} label="Category" value={categoryName(categories, txn.categoryId)} /> : null}
          {txn.note && <SettingsRow icon={<FileText className="h-4 w-4" />} label="Note" value={txn.note} />}
        </div>

        {txn.status === "active" && (
          <button
            onClick={() => {
              run(async () => {
                await api(`/api/v1/transactions/${txn.id}/void`, { method: "POST", body: JSON.stringify({ reason: "Voided from UI" }) });
                await refresh();
                onClose();
              }, "Transaction voided");
            }}
            className="mt-6 w-full rounded-[14px] border border-red-200 bg-red-50 px-4 py-4 text-[14px] font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            Void transaction
          </button>
        )}
      </div>
    </div>
  );
}
