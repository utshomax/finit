import { type FormEvent } from "react";
import { FloatingField, Select } from "../ui/forms";
import type { Account } from "../../lib/types";

export function AccountModal({
  account,
  onClose,
  onSubmit,
}: {
  account: Account | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!account) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-0 sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
      <button className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative max-h-[88vh] w-full overflow-auto rounded-t-[20px] border border-black/10 bg-[#FAFAF7] p-6 shadow-[0_-16px_40px_rgba(0,0,0,0.18)] sm:max-w-lg sm:rounded-[20px]"
      >
        <input type="hidden" name="id" value={account.id} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">Edit</div>
            <h2 id="account-modal-title" className="mt-1 font-serif text-3xl tracking-[-0.02em]">Account</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60">Close</button>
        </div>

        <div className="mt-6 grid gap-3">
          <FloatingField name="name" label="Name" defaultValue={account.name} />
          <Select name="type" label="Type" defaultValue={account.type} options={["cash", "bank", "card", "wallet", "savings", "loan", "other"]} />
          <FloatingField name="currency" label="Currency" defaultValue={account.currency} />
          <FloatingField name="openingBalance" label="Opening balance" type="number" step="0.01" defaultValue={(account.openingBalanceMinor / 100).toFixed(2)} />
        </div>

        <button className="mt-6 w-full rounded-[14px] bg-[#111] px-4 py-4 text-[14px] font-medium text-[#FAFAF7]">Save account</button>
      </form>
    </div>
  );
}
