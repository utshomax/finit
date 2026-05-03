import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function SelectButton({
  value,
  onChange,
  children,
  active,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center ${className ?? ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer appearance-none rounded-lg border py-2 pl-3 pr-8 text-[13px] focus:outline-none focus:ring-1 focus:ring-black/20 ${
          active
            ? "border-black/30 bg-[#111] text-[#FAFAF7]"
            : "border-black/10 bg-white text-black/65"
        }`}
      >
        {children}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-2.5 h-3.5 w-3.5 ${active ? "text-[#FAFAF7]/60" : "text-black/40"}`}
      />
    </div>
  );
}

export function SmallButton({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`rounded-md border border-black/10 px-2.5 py-1.5 text-xs ${danger ? "text-red-700" : "text-black/65"}`}>{children}</button>;
}

export function IconButton({ label, children, highlighted }: { label: string; children: ReactNode; highlighted?: boolean }) {
  return <button aria-label={label} className={`grid h-9 w-9 place-items-center rounded-lg text-black/65 transition-colors hover:bg-black/[0.06] ${highlighted ? "bg-black/[0.06]" : ""}`}>{children}</button>;
}

export function IconTile({ children }: { children: ReactNode }) {
  return <div className="grid h-8 w-8 place-items-center rounded-lg bg-black/[0.06] text-black/65">{children}</div>;
}

export function FilterPill({ children }: { children: ReactNode }) {
  return <button className="rounded-lg border border-black/10 bg-[#FAFAF7] px-3 py-2 text-xs text-black/65">{children}</button>;
}
