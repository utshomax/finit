import { useState, type FormEvent } from "react";
import { Select } from "../ui/forms";
import { CategoryTile, IconPicker } from "../ui/category-icon";
import type { Category } from "../../lib/types";

export function CategoryModal({
  category,
  onClose,
  onSubmit,
}: {
  category: Category | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#111111");
  const [icon, setIcon] = useState(category?.icon || "");

  if (!category) return null;

  const displayName = name.trim() || category.name;
  // Build a preview category object to feed CategoryTile
  const preview: Category = { ...category, name: displayName, color, icon: icon || undefined };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-0 sm:place-items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <button className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative max-h-[88vh] w-full overflow-auto rounded-t-[20px] border border-black/10 bg-[#FAFAF7] p-6 shadow-[0_-16px_40px_rgba(0,0,0,0.18)] sm:max-w-lg sm:rounded-[20px]"
      >
        <input type="hidden" name="id" value={category.id} />

        {/* Header — live preview */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CategoryTile category={preview} size="lg" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-black/50">Edit category</div>
              <h2
                id="category-modal-title"
                className="mt-0.5 font-serif text-2xl tracking-[-0.02em] leading-tight"
              >
                {displayName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/10 px-3 py-2 text-xs text-black/60"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {/* Name */}
          <label className="block rounded-[14px] border border-black/10 px-4 pb-3 pt-2.5">
            <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Name</div>
            <input
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-[15px] text-[#111] outline-none placeholder:text-black/30"
            />
          </label>

          {/* Type */}
          <Select
            name="type"
            label="Type"
            defaultValue={category.type}
            options={[
              { value: "expense", label: "Spending" },
              { value: "income", label: "Income" },
              { value: "both", label: "Both" },
            ]}
          />

          {/* Color */}
          <label className="block rounded-[14px] border border-black/10 px-4 pb-3 pt-2.5">
            <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Color</div>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-lg border border-black/10 bg-transparent p-0.5 outline-none"
              />
              <span className="font-mono text-[14px] text-[#111]">{color}</span>
            </div>
          </label>

          {/* Icon picker */}
          <input type="hidden" name="icon" value={icon} />
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <button className="mt-6 w-full rounded-[14px] bg-[#111] px-4 py-4 text-[14px] font-medium text-[#FAFAF7]">
          Save category
        </button>
      </form>
    </div>
  );
}
