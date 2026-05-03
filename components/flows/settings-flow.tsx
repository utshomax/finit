import { ChevronRight, Home, Bell, WalletCards, Settings, Activity, KeyRound, Download, LogOut } from "lucide-react";
import { SettingsRow } from "../dashboard/rows";
import type { User } from "../../lib/types";

export function SettingsFlow({ user, logout }: { user: User; logout: () => void }) {
  const initial = (user.email?.[0] || "A").toUpperCase();
  const displayName = user.email.split("@")[0].replace(/^./, c => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Profile card — full width */}
      <div className="flex items-center gap-4 rounded-[20px] border border-black/10 bg-white px-5 py-5">
        <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-[#111] font-serif text-xl text-[#FAFAF7]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-medium">{displayName}</div>
          <div className="mt-0.5 text-[13px] text-black/50">{user.email}</div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-black/30" />
      </div>

      {/* Two-column grid on large screens */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <section>
            <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.08em] text-black/45">Account</div>
            <div className="divide-y divide-black/10 rounded-[20px] border border-black/10 bg-white">
              <SettingsRow icon={<Home className="h-4 w-4" />} label="Profile" value={displayName} />
              <SettingsRow icon={<Bell className="h-4 w-4" />} label="Email" value={user.email} />
              <SettingsRow icon={<WalletCards className="h-4 w-4" />} label="Base currency" value={user.baseCurrency} />
            </div>
          </section>

          <section>
            <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.08em] text-black/45">Preferences</div>
            <div className="divide-y divide-black/10 rounded-[20px] border border-black/10 bg-white">
              <SettingsRow icon={<Settings className="h-4 w-4" />} label="Appearance" value="System" />
              <SettingsRow icon={<Activity className="h-4 w-4" />} label="Privacy mode" value="Off" />
              <SettingsRow icon={<Bell className="h-4 w-4" />} label="Notifications" value="On" />
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <section>
            <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.08em] text-black/45">Connections</div>
            <div className="divide-y divide-black/10 rounded-[20px] border border-black/10 bg-white">
              <SettingsRow icon={<WalletCards className="h-4 w-4" />} label="Linked accounts" value="3" />
              <SettingsRow icon={<KeyRound className="h-4 w-4" />} label="API keys" value="2" />
              <SettingsRow icon={<Download className="h-4 w-4" />} label="Export data" value="CSV" />
            </div>
          </section>

          <section>
            <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.08em] text-black/45">Danger zone</div>
            <div className="rounded-[20px] border border-black/10 bg-white p-5">
              <p className="text-[13px] text-black/50 leading-relaxed">
                Signing out will end your current session. Your data will remain safe and accessible when you sign back in.
              </p>
              <button
                onClick={logout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-black/10 px-4 py-3.5 text-[14px] text-black/70 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
