import { Plus } from "lucide-react";
import { money, api } from "../../lib/utils";
import { EmptyState } from "../ui/layout";
import type { Account, Runner } from "../../lib/types";

export function AccountsFlow({
  accounts,
  refresh,
  run,
  onNew,
  onEdit,
}: {
  accounts: Account[];
  refresh: () => Promise<void>;
  run: Runner;
  onNew: () => void;
  onEdit: (account: Account) => void;
}) {
  const active = accounts.filter((a) => a.status === "active");
  const totalBalance = active.reduce((sum, a) => sum + (a.balanceMinor ?? a.openingBalanceMinor), 0);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="text-xs text-black/50">
          {active.length} active · {money(totalBalance)} total
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-xs font-medium text-[#FAFAF7]"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState text="Create your first account." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const balance = account.balanceMinor ?? account.openingBalanceMinor;
            const isArchived = account.status === "archived";
            return (
              <button
                key={account.id}
                onClick={() => onEdit(account)}
                className={`group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white p-5 text-left transition-colors hover:bg-black/[0.02] sm:p-6 ${isArchived ? "opacity-50" : ""}`}
              >
                <div>
                  <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">
                    {account.type}
                  </div>
                  <div className="mt-1 text-[15px] font-medium">{account.name}</div>
                </div>
                <div>
                  <div
                    className={`font-serif text-4xl leading-none tracking-[-0.01em] sm:text-5xl ${balance < 0 ? "text-[#8b4513]" : ""}`}
                  >
                    {money(balance, account.currency)}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] tabular-nums text-black/45">
                      {account.currency}
                    </span>
                    {isArchived ? (
                      <span className="text-[11px] text-black/30">Archived</span>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          run(async () => {
                            await api(`/api/v1/accounts/${account.id}/archive`, { method: "POST" });
                            await refresh();
                          }, "Account archived");
                        }}
                        className="text-[11px] text-black/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-black/70"
                      >
                        Archive
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
