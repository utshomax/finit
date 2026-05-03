import { Logo } from "./logo";
import { navItems } from "../../lib/constants";
import type { Tab, User } from "../../lib/types";

export function Sidebar({ tab, setTab, user, logout }: { tab: Tab; setTab: (tab: Tab) => void; user: User; logout: () => void }) {
  const initial = (user.email?.[0] || "A").toUpperCase();
  return (
    <aside className="hidden h-full overflow-y-auto border-r border-black/10 px-4 py-6 lg:grid lg:grid-rows-[auto_1fr_auto]">
      <Logo />
      <nav className="mt-8 grid content-start gap-0.5">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            className={`grid grid-cols-[18px_1fr] items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${tab === id ? "bg-black/[0.06] text-[#111]" : "text-black/65 hover:bg-black/[0.03]"}`}
            key={id}
            onClick={() => setTab(id)}
          >
            <Icon className="h-[15px] w-[15px]" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="grid gap-3">
        <button onClick={() => setTab("api")} className="rounded-xl bg-black/[0.06] p-3 text-left text-xs leading-[1.45] text-black/65">
          <div className="font-medium text-[#111]">Connect automation</div>
          <p className="mt-0.5">Create a scoped API key for shortcuts and SMS parsers.</p>
        </button>
        <button onClick={() => setTab("settings")} className="flex w-full items-center gap-2.5 rounded-lg p-1 text-left hover:bg-black/[0.03] transition-colors">
          <div className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-full bg-[#111] font-serif text-[14px] text-[#FAFAF7]">{initial}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user.email.split("@")[0].replace(/^./, c => c.toUpperCase())}</div>
            <div className="truncate text-[11px] text-black/50">{user.email}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
