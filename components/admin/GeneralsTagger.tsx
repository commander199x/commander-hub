"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Wand2, Search, Info, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { logAdminAction } from "@/lib/auditLog";
import { useFeedback } from "@/components/FeedbackProvider";
import { loadMatches, isWin, type StatMatch } from "@/lib/matchData";
import { GENERALS, FACTIONS, readGenerals, isGeneralKey, type Faction, type GeneralKey } from "@/lib/generals";

// Admin tool: record which general each player used in a match (works for past matches too).
const STEP = 12;

export default function GeneralsTagger({ adminUsername }: { adminUsername: string }) {
  const fb = useFeedback();
  const supabase = useMemo(() => createClient(), []);
  const [matches, setMatches] = useState<StatMatch[]>([]);
  const [hasGenerals, setHasGenerals] = useState(true);
  const [loading, setLoading] = useState(true);
  const [onlyUntagged, setOnlyUntagged] = useState(true);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(STEP);
  const [drafts, setDrafts] = useState<Record<string, Record<string, GeneralKey | "">>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    loadMatches(supabase).then(({ matches, hasGenerals }) => {
      setMatches(matches);
      setHasGenerals(hasGenerals);
      setLoading(false);
    });
  }, [supabase]);

  // Each player's most recently used general — used by "Auto-fill"
  const lastUsed = useMemo(() => {
    const out: Record<string, GeneralKey> = {};
    for (const m of matches) for (const [p, g] of Object.entries(readGenerals(m.generals))) if (!out[p]) out[p] = g;
    return out;
  }, [matches]);

  const taggedCount = matches.filter((m) => Object.keys(readGenerals(m.generals)).length > 0).length;
  const q = query.trim().toLowerCase();
  const list = matches.filter(
    (m) =>
      (!onlyUntagged || Object.keys(readGenerals(m.generals)).length === 0) &&
      (!q || m.participants.some((p) => p.toLowerCase().includes(q)) || (m.map ?? "").toLowerCase().includes(q))
  );

  const valueFor = (m: StatMatch, p: string): GeneralKey | "" => drafts[m.id]?.[p] ?? readGenerals(m.generals)[p] ?? "";
  const setValue = (id: string, p: string, v: GeneralKey | "") => setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [p]: v } }));
  const isDirty = (m: StatMatch) => !!drafts[m.id] && m.participants.some((p) => (drafts[m.id][p] ?? readGenerals(m.generals)[p] ?? "") !== (readGenerals(m.generals)[p] ?? ""));

  function autofill(m: StatMatch) {
    const next: Record<string, GeneralKey | ""> = { ...(drafts[m.id] ?? {}) };
    for (const p of m.participants) if (!valueFor(m, p) && lastUsed[p]) next[p] = lastUsed[p];
    setDrafts((d) => ({ ...d, [m.id]: next }));
  }

  async function save(m: StatMatch) {
    const generals: Record<string, GeneralKey> = {};
    for (const p of m.participants) {
      const v = valueFor(m, p);
      if (isGeneralKey(v)) generals[p] = v;
    }
    setSaving(m.id);
    const { error } = await supabase.from("matches").update({ generals }).eq("id", m.id);
    setSaving(null);
    if (error) {
      fb.error(`Couldn't save the generals: ${error.message}`);
      return;
    }
    await logAdminAction(supabase, adminUsername, "tag_generals", { match_id: m.id, generals });
    setMatches((all) => all.map((x) => (x.id === m.id ? { ...x, generals } : x)));
    setDrafts((d) => {
      const n = { ...d };
      delete n[m.id];
      return n;
    });
    setSavedId(m.id);
    setTimeout(() => setSavedId((s) => (s === m.id ? null : s)), 1800);
  }

  if (loading) return <p className="text-sm" style={{ color: C.muted }}>Loading matches…</p>;
  if (!hasGenerals) {
    return (
      <div className="flex items-start gap-3 border p-4 text-sm" style={{ borderColor: C.amberDim, background: C.void, color: C.muted }}>
        <Info size={18} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />
        <span>Run <code style={{ color: C.amber }}>sql/generals.sql</code> once in Supabase → SQL Editor to switch this on. Nothing else needs to change.</span>
      </div>
    );
  }

  const pct = matches.length ? Math.round((taggedCount / matches.length) * 100) : 0;

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between text-xs uppercase tracking-widest" style={{ color: C.muted }}>
          <span>{taggedCount} of {matches.length} matches tagged</span>
          <span style={{ color: C.amber }}>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2" style={{ background: C.line }}><div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: C.amber }} /></div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative flex-[1_1_220px]">
          <span className="sr-only">Search player or map</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
          <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setShown(STEP); }} placeholder="Search player or map" className="min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] pe-3 ps-9 text-sm text-[#EDEAE0]" />
        </label>
        <button onClick={() => { setOnlyUntagged((v) => !v); setShown(STEP); }} aria-pressed={onlyUntagged} className="inline-flex min-h-[44px] items-center border px-4 text-xs uppercase tracking-widest" style={{ background: onlyUntagged ? C.amber : "transparent", color: onlyUntagged ? C.void : C.paper, borderColor: onlyUntagged ? C.amber : C.amberDim, fontWeight: onlyUntagged ? 700 : 500 }}>
          Untagged only
        </button>
      </div>

      {list.length === 0 ? (
        <p className="border px-4 py-8 text-center text-sm" style={{ borderColor: C.line, color: C.muted }}>{onlyUntagged ? "Every match is tagged. 🎖" : "No matches found."}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.slice(0, shown).map((m) => (
            <div key={m.id} className="border" style={{ borderColor: savedId === m.id ? C.radar : C.line, background: C.void, transition: "border-color 0.3s ease" }}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2 text-xs" style={{ borderColor: C.line, color: C.muted }}>
                <span className="uppercase tracking-widest" style={{ color: C.amber }}>{m.mode}</span>
                <span style={{ color: C.paper }}>{m.map || "Unknown map"}</span>
                {m.tournament_name && <span>{m.tournament_name}</span>}
                <span className="ms-auto">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                {m.participants.map((p) => (
                  <label key={p} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-sm" style={{ color: isWin(m, p) ? C.radar : "#F87171", fontWeight: 600 }} title={isWin(m, p) ? "Won" : "Lost"}>
                      {isWin(m, p) ? "▲" : "▼"} {p}
                    </span>
                    <select value={valueFor(m, p)} onChange={(e) => setValue(m.id, p, e.target.value as GeneralKey | "")} className="min-h-[40px] min-w-0 flex-1 border border-[#8A6425] bg-[#12150E] px-2 text-sm text-[#EDEAE0]">
                      <option value="">— not recorded —</option>
                      {(Object.keys(FACTIONS) as Faction[]).map((f) => (
                        <optgroup key={f} label={FACTIONS[f].en}>
                          {GENERALS.filter((g) => g.faction === f).map((g) => <option key={g.key} value={g.key}>{g.en}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3" style={{ borderColor: C.line }}>
                <button onClick={() => autofill(m)} title="Fill empty players with the general they used most recently" className="inline-flex min-h-[40px] items-center gap-2 border px-3 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10]" style={{ borderColor: C.lineStrong, color: C.muted }}>
                  <Wand2 size={14} aria-hidden="true" /> Auto-fill
                </button>
                <button onClick={() => save(m)} disabled={!isDirty(m) || saving === m.id} className="inline-flex min-h-[40px] items-center gap-2 px-4 text-xs uppercase tracking-widest disabled:opacity-40" style={{ background: savedId === m.id ? C.radar : C.amber, color: C.void, fontWeight: 700 }}>
                  {savedId === m.id ? <Check size={14} aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
                  {saving === m.id ? "Saving…" : savedId === m.id ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {list.length > shown && (
        <div className="mt-4 flex justify-center">
          <button onClick={() => setShown((n) => n + STEP)} className="inline-flex min-h-[44px] items-center border px-6 text-xs uppercase tracking-widest" style={{ borderColor: C.amberDim, color: C.amber }}>
            Show more ({list.length - shown})
          </button>
        </div>
      )}
    </div>
  );
}
