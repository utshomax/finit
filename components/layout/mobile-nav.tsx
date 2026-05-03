import { Home, WalletCards, Plus, Activity, Settings, type LucideIcon } from "lucide-react";
import type { Tab } from "../../lib/types";

export function MobileNav({ tab, setTab, openTransactionModal }: { tab: Tab; setTab: (tab: Tab) => void; openTransactionModal: () => void }) {
  const items: { id: Tab; label: string; icon: LucideIcon; primary?: boolean }[] = [
    { id: "overview", label: "Home", icon: Home },
    { id: "accounts", label: "Accounts", icon: WalletCards },
    { id: "transactions", label: "New transaction", icon: Plus, primary: true },
    { id: "insights", label: "Insights", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 grid grid-cols-5 rounded-2xl border border-black/10 bg-[#FAFAF7]/95 px-3 py-2 shadow-[0_12px_36px_rgba(17,17,17,0.14)] backdrop-blur lg:hidden">
      {items.map(({ id, label, icon: Icon, primary }) => (
        <button
          aria-label={label}
          className={`grid min-w-0 place-items-center gap-1 py-1 ${tab === id ? "text-[#111]" : "text-black/55"}`}
          key={id}
          onClick={() => {
            if (primary) {
              setTab("transactions");
              openTransactionModal();
              return;
            }
            setTab(id);
          }}
        >
          <span className={primary ? "grid h-11 w-11 place-items-center rounded-xl bg-[#111] text-[#FAFAF7]" : ""}><Icon className="h-5 w-5" aria-hidden="true" /></span>
          {!primary ? <span className="max-w-full truncate text-[10px]">{label}</span> : null}
        </button>
      ))}
    </nav>
  );
}
