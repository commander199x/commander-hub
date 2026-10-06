"use client";

import { GENERALS, FACTIONS, type Faction, type GeneralKey } from "@/lib/generals";

// Dropdown for "which general did this player use" (optional).
export default function GeneralSelect({ value, onChange, label, lang = "en", compact = false }: { value: GeneralKey | ""; onChange: (v: GeneralKey | "") => void; label: string; lang?: "en" | "ar"; compact?: boolean }) {
  const color = value ? FACTIONS[GENERALS.find((g) => g.key === value)!.faction].color : "#8A6425";
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as GeneralKey | "")}
      className={`${compact ? "min-h-[36px] text-xs" : "min-h-[40px] text-sm"} min-w-0 border bg-[#0A0C08] px-2 text-[#EDEAE0]`}
      style={{ borderColor: color }}
    >
      <option value="">{lang === "ar" ? "— الجنرال (اختياري) —" : "— General (optional) —"}</option>
      {(Object.keys(FACTIONS) as Faction[]).map((f) => (
        <optgroup key={f} label={FACTIONS[f][lang]}>
          {GENERALS.filter((g) => g.faction === f).map((g) => <option key={g.key} value={g.key}>{g[lang]}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
