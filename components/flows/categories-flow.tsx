import { useState } from "react";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
import { api } from "../../lib/utils";
import { EmptyState } from "../ui/layout";
import { CategoryTile } from "../ui/category-icon";
import type { Category, Runner } from "../../lib/types";

export function CategoriesFlow({
  categories,
  refresh,
  run,
  onNew,
  onEdit,
}: {
  categories: Category[];
  refresh: () => Promise<void>;
  run: Runner;
  onNew: () => void;
  onEdit: (category: Category) => void;
}) {
  const [catTab, setCatTab] = useState<"expense" | "income">("expense");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = categories.filter((c) => c.type === catTab || c.type === "both");
  const active = filtered.filter((c) => c.status === "active");
  const archived = filtered.filter((c) => c.status === "archived");

  const expenseCount = categories.filter(
    (c) => (c.type === "expense" || c.type === "both") && c.status === "active",
  ).length;
  const incomeCount = categories.filter(
    (c) => (c.type === "income" || c.type === "both") && c.status === "active",
  ).length;

  async function archiveCategory(id: string) {
    await run(async () => {
      await api(`/api/v1/categories/${id}/archive`, { method: "POST" });
      await refresh();
    }, "Category archived");
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-1 gap-0 rounded-xl bg-black/[0.06] p-1">
          <button
            onClick={() => setCatTab("expense")}
            className={`flex-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${catTab === "expense" ? "bg-white text-[#111] shadow-sm" : "text-black/55"}`}
          >
            Spending
            {expenseCount > 0 && (
              <span className="ml-1.5 opacity-55">({expenseCount})</span>
            )}
          </button>
          <button
            onClick={() => setCatTab("income")}
            className={`flex-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${catTab === "income" ? "bg-white text-[#111] shadow-sm" : "text-black/55"}`}
          >
            Income
            {incomeCount > 0 && (
              <span className="ml-1.5 opacity-55">({incomeCount})</span>
            )}
          </button>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-xs font-medium text-[#FAFAF7]"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <div className="divide-y divide-black/[0.08]">
        {active.length === 0 ? (
          <EmptyState text={`No ${catTab === "expense" ? "spending" : "income"} categories yet.`} />
        ) : (
          active.map((category) => (
            <div key={category.id} className="flex items-center gap-3 py-3">
              <button
                onClick={() => onEdit(category)}
                className="flex flex-1 items-center gap-3 min-w-0 text-left transition-colors hover:opacity-80"
              >
                <CategoryTile category={category} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium">{category.name}</span>
                    {category.type === "both" && (
                      <span className="flex-shrink-0 rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-black/45">
                        Both
                      </span>
                    )}
                  </div>
                </div>
              </button>
              <button
                onClick={() => archiveCategory(category.id)}
                className="flex-shrink-0 rounded-md border border-black/[0.08] px-2.5 py-1.5 text-[11px] text-black/35 transition-colors hover:border-black/20 hover:text-black/60"
              >
                Archive
              </button>
            </div>
          ))
        )}
      </div>

      {archived.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setShowArchived((prev) => !prev)}
            className="flex items-center gap-1.5 text-[12px] text-black/40 transition-colors hover:text-black/60"
          >
            {showArchived ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Archived ({archived.length})
          </button>
          {showArchived && (
            <div className="mt-2 divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.08]">
              {archived.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 px-3 py-3 opacity-45"
                >
                  <CategoryTile category={category} />
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-[13px] font-medium line-through">
                      {category.name}
                    </span>
                  </div>
                  <span className="flex-shrink-0 text-[11px] text-black/40">Archived</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
