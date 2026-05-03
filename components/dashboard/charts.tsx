import type { Dashboard } from "../../lib/types";

export function DonutSummary({ total, items }: { total: string; items: Dashboard["expenseByCategory"] }) {
  const totalFontSize = total.length > 9 ? (total.length > 12 ? "text-[11px]" : "text-[13px]") : "text-xl";
  const gradients = items.length
    ? items.slice(0, 5).map((item, index) => {
      const sum = items.reduce((acc, cat) => acc + cat.amountMinor, 0) || 1;
      const start = items.slice(0, index).reduce((acc, cat) => acc + cat.amountMinor, 0) / sum * 100;
      const end = start + item.amountMinor / sum * 100;
      const color = `rgba(17,17,17,${0.95 - index * 0.14})`;
      return `${color} ${start}% ${end}%`;
    }).join(", ")
    : "rgba(17,17,17,0.08) 0 100%";

  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(${gradients})` }}>
      <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Total</div>
          <div className={`mt-1 font-serif tabular-nums leading-tight ${totalFontSize}`}>{total}</div>
        </div>
      </div>
    </div>
  );
}
