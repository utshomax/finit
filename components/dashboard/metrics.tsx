import { Sparkline } from "../ui/sparkline";

export function DashboardMetric({ title, value, sub, delta, positive }: { title: string; value: string; sub: string; delta: string; positive?: boolean }) {
  return (
    <div className="relative min-h-[196px] overflow-hidden rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
      <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">{title}</div>
      <div className={`mt-3 font-serif text-4xl leading-none tracking-[-0.01em] sm:text-5xl ${positive ? "text-[#5c8064]" : ""}`}>{value}</div>
      <div className="mt-4 text-xs leading-5 text-black/50">{sub}<br />{delta}</div>
      <Sparkline className="absolute bottom-0 right-0 h-16 w-44 opacity-70" muted={positive} />
    </div>
  );
}

export function MiniInsight({ title, value, detail, onClick }: { title: string; value: string; detail: string; onClick?: () => void }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component onClick={onClick} className="rounded-2xl border border-black/10 bg-white p-5 text-left">
      <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">{title}</div>
      <div className="mt-2 font-serif text-3xl leading-none">{value}</div>
      <div className="mt-3 text-xs leading-5 text-black/55">{detail}</div>
    </Component>
  );
}

export function InsightCard({ eyebrow, title, detail, onClick }: { eyebrow: string; title: string; detail: string; onClick?: () => void }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component onClick={onClick} className="rounded-2xl border border-black/10 bg-white p-5 text-left sm:p-6">
      <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">{eyebrow}</div>
      <div className="mt-3 font-serif text-2xl leading-tight tracking-[-0.01em]">{title}</div>
      <div className="mt-3 text-sm leading-6 text-black/60">{detail}</div>
      <Sparkline className="mt-5 h-12 opacity-70" />
    </Component>
  );
}
