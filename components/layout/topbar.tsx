import { useState, useEffect } from "react";
import { Search, Bell, Plus } from "lucide-react";
import { Logo } from "./logo";
import { navItems } from "../../lib/constants";
import { IconButton, SelectButton } from "../ui/buttons";
import { PERIOD_LABELS } from "../../lib/utils";
import type { Period, Tab, User } from "../../lib/types";

// Which tabs show each action
const TABS_WITH_SEARCH: Tab[] = ["transactions"];
const TABS_WITH_NOTIFICATIONS: Tab[] = ["overview"];
const TABS_WITH_PERIOD: Tab[] = ["insights"];
const TABS_WITH_NEW_TRANSACTION: Tab[] = ["overview", "transactions"];

export function Topbar({
  tab,
  period,
  onPeriodChange,
  openTransactionModal,
  user,
}: {
  tab: Tab;
  period: Period;
  onPeriodChange: (p: Period) => void;
  openTransactionModal: () => void;
  user?: User;
}) {
  const title = navItems.find((item) => item.id === tab)?.label || "Settings";
  const firstName = user
    ? user.email.split("@")[0].replace(/^./, (c) => c.toUpperCase())
    : "there";
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  const showSearch = TABS_WITH_SEARCH.includes(tab);
  const showNotifications = true;
  const showPeriod = TABS_WITH_PERIOD.includes(tab);
  const showNewTransaction = TABS_WITH_NEW_TRANSACTION.includes(tab);
  const hasActions = showSearch || showNotifications || showPeriod || showNewTransaction;

  return (
    <header className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div>
        <div className="pl-1 lg:hidden"><Logo /></div>
        <div className={`mt-4 text-[11px] uppercase tracking-[0.08em] text-black/50 lg:mt-0 ${tab === "overview" ? "hidden lg:block" : ""}`}>
          {dateLabel || "Today"}
        </div>
        <h1 className={`mt-1 font-serif text-3xl leading-tight tracking-[-0.01em] sm:text-4xl ${tab === "overview" ? "hidden lg:block" : ""}`}>
          {tab === "overview" ? `Good morning, ${firstName}.` : title}
        </h1>
      </div>
      {hasActions && (
        <div className="flex gap-2">
          {showSearch && <IconButton label="Search"><Search className="h-4 w-4" /></IconButton>}
          {showNotifications && <IconButton label="Notifications" highlighted><Bell className="h-4 w-4" /></IconButton>}
          {showPeriod && (
            <SelectButton
              value={period}
              onChange={(v) => onPeriodChange(v as Period)}
              className="hidden md:inline-flex"
            >
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
              ))}
            </SelectButton>
          )}
          {showNewTransaction && (
            <button onClick={openTransactionModal} className="hidden items-center gap-2 rounded-lg bg-[#111] px-4 py-2 text-[13px] font-medium text-[#FAFAF7] sm:flex">
              <Plus className="h-4 w-4" /> New transaction
            </button>
          )}
        </div>
      )}
    </header>
  );
}
