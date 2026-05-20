"use client";

import type { City } from "@/lib/schemas";

type Props = {
  cities: City[];
  value: string | null;
  onChange: (cityId: string) => void;
  className?: string;
  /** Renders an "(Archived)" suffix on soft-deleted cities. */
  showArchivedBadge?: boolean;
};

export function CitySelector({
  cities,
  value,
  onChange,
  className,
  showArchivedBadge = false,
}: Props) {
  return (
    <label className={`flex items-center gap-3 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-mute">
        City
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink-line/60 bg-bg px-3 py-2 text-sm text-ink shadow-soft focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {showArchivedBadge && c.deleted_at ? " (Archived)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
