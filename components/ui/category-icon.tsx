import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Wifi,
  Shirt,
  Dumbbell,
  Music,
  Plane,
  Heart,
  GraduationCap,
  Gift,
  Coffee,
  Film,
  BookOpen,
  Wrench,
  Briefcase,
  TrendingUp,
  PiggyBank,
  Coins,
  Bus,
  Gamepad2,
  Dog,
  ShoppingBag,
  Pill,
  Baby,
  Bike,
  ArrowRightLeft,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "../../lib/types";

export const ICON_OPTIONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "shopping-cart",  label: "Shopping",   Icon: ShoppingCart },
  { name: "shopping-bag",   label: "Bag",        Icon: ShoppingBag },
  { name: "utensils",       label: "Dining",     Icon: Utensils },
  { name: "coffee",         label: "Coffee",     Icon: Coffee },
  { name: "car",            label: "Car",        Icon: Car },
  { name: "bus",            label: "Transit",    Icon: Bus },
  { name: "bike",           label: "Cycling",    Icon: Bike },
  { name: "plane",          label: "Travel",     Icon: Plane },
  { name: "home",           label: "Housing",    Icon: Home },
  { name: "zap",            label: "Utilities",  Icon: Zap },
  { name: "wifi",           label: "Internet",   Icon: Wifi },
  { name: "shirt",          label: "Clothing",   Icon: Shirt },
  { name: "dumbbell",       label: "Fitness",    Icon: Dumbbell },
  { name: "heart",          label: "Health",     Icon: Heart },
  { name: "pill",           label: "Pharmacy",   Icon: Pill },
  { name: "baby",           label: "Childcare",  Icon: Baby },
  { name: "dog",            label: "Pets",       Icon: Dog },
  { name: "music",          label: "Music",      Icon: Music },
  { name: "film",           label: "Movies",     Icon: Film },
  { name: "gamepad",        label: "Games",      Icon: Gamepad2 },
  { name: "book",           label: "Books",      Icon: BookOpen },
  { name: "graduation-cap", label: "Education",  Icon: GraduationCap },
  { name: "gift",           label: "Gifts",      Icon: Gift },
  { name: "wrench",         label: "Repairs",    Icon: Wrench },
  { name: "briefcase",      label: "Work",       Icon: Briefcase },
  { name: "trending-up",    label: "Investments",Icon: TrendingUp },
  { name: "piggy-bank",     label: "Savings",    Icon: PiggyBank },
  { name: "coins",          label: "Income",     Icon: Coins },
];

export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map(({ name, Icon }) => [name, Icon]),
);

const sizeConfig = {
  sm: { tile: "h-7 w-7 rounded-md", icon: "h-3 w-3",   text: "text-[10px]" },
  md: { tile: "h-8 w-8 rounded-lg", icon: "h-3.5 w-3.5", text: "text-[11px]" },
  lg: { tile: "h-11 w-11 rounded-xl", icon: "h-5 w-5",  text: "text-base" },
};

/**
 * Renders a colored tile for a category (or a grey transfer tile when category is null).
 * Shows the icon if available, otherwise the category initial.
 */
export function CategoryTile({
  category,
  size = "md",
}: {
  category: Category | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const s = sizeConfig[size];

  if (!category) {
    return (
      <div
        className={`flex-shrink-0 ${s.tile} flex items-center justify-center bg-black/[0.06] text-black/45`}
      >
        <ArrowRightLeft className={s.icon} />
      </div>
    );
  }

  const bg = category.color || "#111111";
  const Icon = category.icon ? ICON_MAP[category.icon] : null;

  return (
    <div
      className={`flex-shrink-0 ${s.tile} flex items-center justify-center font-bold text-white`}
      style={{ background: bg }}
    >
      {Icon ? (
        <Icon className={s.icon} />
      ) : (
        <span className={s.text}>{category.name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

/**
 * A grid picker for selecting a category icon.
 * Renders inline inside a form field wrapper.
 */
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="rounded-[14px] border border-black/10 px-4 pb-3 pt-2.5">
      <div className="text-[10px] uppercase tracking-[0.08em] text-black/45">Icon</div>
      <div className="mt-2.5 grid grid-cols-7 gap-1.5 sm:grid-cols-8">
        {ICON_OPTIONS.map(({ name, label, Icon }) => (
          <button
            key={name}
            type="button"
            title={label}
            onClick={() => onChange(name)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
              value === name
                ? "bg-[#111] text-[#FAFAF7] shadow-sm"
                : "bg-black/[0.05] text-black/45 hover:bg-black/10 hover:text-black/70"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
