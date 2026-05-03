export function Field({ label, name, type = "text", defaultValue, step }: { label: string; name: string; type?: string; defaultValue?: string; step?: string }) {
  return (
    <label className="grid gap-1.5 text-xs text-black/55">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} step={step} className="rounded-lg border border-black/10 bg-[#FAFAF7] px-3 py-2.5 text-sm text-[#111] outline-none focus:border-black/30" />
    </label>
  );
}

export function FloatingField({ label, name, type = "text", defaultValue, step }: { label: string; name: string; type?: string; defaultValue?: string; step?: string }) {
  return (
    <label className="block rounded-[14px] border border-black/10 px-4 pb-3 pt-2.5">
      <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">{label}</div>
      <input name={name} type={type} defaultValue={defaultValue} step={step} className="mt-0.5 w-full bg-transparent text-[15px] text-[#111] outline-none placeholder:text-black/30" />
    </label>
  );
}

export function Select({ label, name, options, defaultValue }: { label: string; name: string; options: (string | { value: string; label: string })[]; defaultValue?: string }) {
  return (
    <label className="grid gap-1.5 text-xs text-black/55">
      {label}
      <select name={name} defaultValue={defaultValue} className="rounded-lg border border-black/10 bg-[#FAFAF7] px-3 py-2.5 text-sm text-[#111] outline-none focus:border-black/30">
        {options.map((option) => typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
