const sparkBars = [
  { id: "d12", height: 26 }, { id: "d13", height: 18 }, { id: "d14", height: 34 }, { id: "d15", height: 20 },
  { id: "d16", height: 44 }, { id: "d17", height: 29 }, { id: "d18", height: 76 }, { id: "d19", height: 33 },
  { id: "d20", height: 24 }, { id: "d21", height: 52 }, { id: "d22", height: 91 }, { id: "d23", height: 38 },
  { id: "d24", height: 21 }, { id: "d25", height: 28 }, { id: "d26", height: 67 }, { id: "d27", height: 35 },
  { id: "d28", height: 26 }, { id: "d29", height: 48 },
];

export function Sparkline({ className, muted }: { className?: string; muted?: boolean }) {
  return (
    <div className={`flex items-end gap-1 ${className ?? ""}`} aria-hidden="true">
      {sparkBars.map(({ id, height }) => (
        <span className={`flex-1 rounded-t-[2px] ${muted ? "bg-[#5c8064]/35" : "bg-black/15"}`} key={id} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}
