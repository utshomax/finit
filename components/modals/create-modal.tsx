import { useState, type FormEvent } from "react";
import { Filter, WalletCards, ChevronRight } from "lucide-react";
import { IconTile } from "../ui/buttons";
import { FloatingField, Select } from "../ui/forms";
import { IconPicker } from "../ui/category-icon";
import { defaultDateInput } from "../../lib/constants";
import type { Account, Category } from "../../lib/types";

const CAT_COLORS = [
  "#e85d4a", "#e8843a", "#d4a017", "#4caf72", "#3b82f6",
  "#8b5cf6", "#ec4899", "#64748b", "#111111", "#6366f1",
];

export function CreateModal({
  type,
  accounts,
  categories,
  onClose,
  onCreateAccount,
  onCreateCategory,
  onCreateTransaction,
}: {
  type: null | "account" | "category" | "transaction";
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onCreateAccount: (event: FormEvent<HTMLFormElement>) => void;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void;
  onCreateTransaction: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [txnType, setTxnType] = useState<"expense" | "income" | "transfer">("expense");
  const [catType, setCatType] = useState<"expense" | "income" | "both">("expense");
  const [catColor, setCatColor] = useState(CAT_COLORS[0]);
  const [catIcon, setCatIcon] = useState("");
  if (!type) return null;

  const onSubmit = {
    account: onCreateAccount,
    category: onCreateCategory,
    transaction: onCreateTransaction,
  }[type];

  if (type === "transaction") {
    return (
      <div className="fixed inset-0 z-50 bg-black/35" role="dialog" aria-modal="true">
        <button className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
        <form
          onSubmit={onSubmit}
          className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-auto rounded-t-[20px] bg-[#FAFAF7] px-5 pb-8 pt-3 shadow-[0_-16px_40px_rgba(0,0,0,0.18)] sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-[20px] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/10 sm:hidden" />
          <div className="grid grid-cols-3 gap-0 rounded-xl bg-black/[0.06] p-1">
            {(["expense", "income", "transfer"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTxnType(t)}
                className={`rounded-lg px-4 py-2 text-xs font-medium capitalize transition-colors ${txnType === t ? "bg-white text-[#111] shadow-sm" : "text-black/55"}`}
              >{t}</button>
            ))}
          </div>
          <input type="hidden" name="type" value={txnType} />

          <div className="py-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Amount</div>
            <div className="mt-2 flex items-baseline justify-center">
              <span className="font-serif text-[56px] leading-none tracking-[-0.02em]">{txnType === "expense" || txnType === "transfer" ? "−" : "+"}</span>
              <span className="font-serif text-[56px] leading-none tracking-[-0.02em]">£</span>
              <input name="amount" type="number" step="0.01" defaultValue="42.50" className="w-40 bg-transparent font-serif text-[56px] leading-none tracking-[-0.02em] text-[#111] outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            </div>
            <div className="mt-2 text-[11px] text-black/50">GBP</div>
          </div>

          <div className="divide-y divide-black/10 rounded-[14px] border border-black/10 bg-white">
            {txnType !== "transfer" ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <IconTile><Filter className="h-3.5 w-3.5" /></IconTile>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Category</div>
                  <select name="categoryId" className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none">
                    {categories.filter(c => c.type === "both" || c.type === txnType).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-black/25" />
              </div>
            ) : null}
            <div className="flex items-center gap-3 px-4 py-3">
              <IconTile><WalletCards className="h-3.5 w-3.5" /></IconTile>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">{txnType === "transfer" ? "From account" : "Account"}</div>
                <select name="accountId" className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {a.currency}</option>)}
                </select>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-black/25" />
            </div>
            {txnType === "transfer" ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3">
                  <IconTile><WalletCards className="h-3.5 w-3.5" /></IconTile>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">To account</div>
                    <select name="destinationAccountId" className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none">
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {a.currency}</option>)}
                    </select>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-black/25" />
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Destination amount</div>
                    <input name="destinationAmount" type="number" step="0.01" placeholder="Defaults to amount" className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-black/25" />
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Exchange rate</div>
                    <input name="exchangeRate" type="number" step="0.000001" placeholder="For cross-currency transfers" className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none" />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-black/25" />
                </div>
              </>
            ) : null}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Date</div>
                <input name="date" type="date" defaultValue={defaultDateInput} className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none" />
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-black/25" />
            </div>
            {txnType !== "transfer" ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8" />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Merchant</div>
                  <input name="merchant" defaultValue="Dishoom" className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-black/25" />
              </div>
            ) : null}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Note</div>
                <input name="note" defaultValue={txnType === "transfer" ? "Transfer" : "Dinner"} className="mt-0.5 w-full bg-transparent text-[14px] text-[#111] outline-none" />
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-black/25" />
            </div>
          </div>

          <button className="mt-5 w-full rounded-[14px] bg-[#111] px-4 py-4 text-[14px] font-medium text-[#FAFAF7]">Save transaction</button>
        </form>
      </div>
    );
  }

  const titles = { account: "New account", category: "New category", transaction: "New transaction" };
  const submitLabels = { account: "Create account", category: "Create category", transaction: "Save transaction" };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-0 sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
      <button className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative max-h-[88vh] w-full overflow-auto rounded-t-[20px] border border-black/10 bg-[#FAFAF7] p-6 shadow-[0_-16px_40px_rgba(0,0,0,0.18)] sm:max-w-lg sm:rounded-[20px]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">Create</div>
            <h2 id="create-modal-title" className="mt-1 font-serif text-3xl tracking-[-0.02em]">{titles[type]}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60">Close</button>
        </div>

        <div className="mt-6 grid gap-3">
          {type === "account" ? (
            <>
              <FloatingField name="name" label="Name" defaultValue="Cash Wallet" />
              <Select name="type" label="Type" options={["cash", "bank", "card", "wallet", "savings", "loan", "other"]} />
              <FloatingField name="currency" label="Currency" defaultValue="GBP" />
              <FloatingField name="openingBalance" label="Opening balance" type="number" step="0.01" defaultValue="100.00" />
            </>
          ) : null}

          {type === "category" ? (
            <>
              {/* Type segmented control */}
              <div className="grid grid-cols-3 gap-0 rounded-xl bg-black/[0.06] p-1">
                {(["expense", "income", "both"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCatType(t)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${catType === t ? "bg-white text-[#111] shadow-sm" : "text-black/55"}`}
                  >
                    {t === "expense" ? "Spending" : t === "income" ? "Income" : "Both"}
                  </button>
                ))}
              </div>
              <input type="hidden" name="type" value={catType} />
              <input type="hidden" name="color" value={catColor} />
              <input type="hidden" name="icon" value={catIcon} />

              {/* Name with preview tile */}
              <label className="block rounded-[14px] border border-black/10 px-4 pb-3 pt-2.5">
                <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Name</div>
                <input
                  name="name"
                  type="text"
                  defaultValue="Groceries"
                  className="mt-0.5 w-full bg-transparent text-[15px] text-[#111] outline-none placeholder:text-black/30"
                />
              </label>

              {/* Color swatches */}
              <div className="rounded-[14px] border border-black/10 px-4 pb-3 pt-2.5">
                <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Color</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CAT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCatColor(c)}
                      className="h-7 w-7 rounded-lg transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: catColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                  <label
                    className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-black/20 transition-colors hover:border-black/40"
                    title="Custom color"
                  >
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-black/30">+</span>
                  </label>
                </div>
              </div>

              {/* Icon picker */}
              <IconPicker value={catIcon} onChange={setCatIcon} />
            </>
          ) : null}
        </div>

        <button className="mt-6 w-full rounded-[14px] bg-[#111] px-4 py-4 text-[14px] font-medium text-[#FAFAF7]">{submitLabels[type]}</button>
      </form>
    </div>
  );
}
