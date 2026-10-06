"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X, ShieldCheck, Clock, Flag, Link2, Map as MapIcon, Loader2, Info, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { logAdminAction } from "@/lib/auditLog";
import { useFeedback } from "@/components/FeedbackProvider";
import { logMatch, type Mode } from "@/lib/logMatch";
import { readGenerals, generalShort } from "@/lib/generals";

// Admin queue for player-reported results. Approving logs the match with the
// exact same rating maths as "Log a match".
type Sub = {
  id: string; created_at: string; submitter_username: string; mode: Mode; participants: string[]; winners: string[];
  map: string | null; notes: string | null; replay_url: string | null; generals: unknown; match_date: string;
  status: "pending" | "confirmed" | "disputed" | "approved" | "rejected"; confirmed_by: string | null; dispute_reason: string | null;
};
const LOSS = "#F87171";

export default function SubmissionsQueue({ adminUsername }: { adminUsername: string }) {
  const supabase = useMemo(() => createClient(), []);
  const fb = useFeedback();
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [ready, setReady] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("match_submissions").select("*").in("status", ["confirmed", "pending", "disputed"]).order("created_at", { ascending: true });
    if (error) {
      setReady(false);
      setSubs([]);
      return;
    }
    const order = { confirmed: 0, disputed: 1, pending: 2, approved: 3, rejected: 4 };
    setSubs(((data ?? []) as Sub[]).sort((a, b) => order[a.status] - order[b.status] || a.created_at.localeCompare(b.created_at)));
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(s: Sub) {
    if (s.status !== "confirmed") {
      const ok = await fb.confirm({
        title: "Approve without confirmation?",
        message: s.status === "disputed" ? `${s.confirmed_by} disputed this result: “${s.dispute_reason}”. Approve it anyway?` : "The other side hasn't confirmed this result yet. Approve it anyway?",
        confirmLabel: "Approve",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(s.id);
    // Re-check it hasn't been handled by another admin in the meantime
    const { data: fresh } = await supabase.from("match_submissions").select("status").eq("id", s.id).single();
    if (!fresh || !["pending", "confirmed", "disputed"].includes((fresh as { status: string }).status)) {
      setBusy(null);
      fb.info("Another admin already handled this report.");
      return load();
    }
    const { error, matchId } = await logMatch(supabase, {
      mode: s.mode,
      participants: s.participants,
      winners: s.winners,
      notes: s.notes,
      map: s.map,
      createdAt: new Date(`${s.match_date}T12:00:00`).toISOString(),
      replayUrl: s.replay_url,
      generals: readGenerals(s.generals),
    });
    if (error) {
      setBusy(null);
      return fb.error(`Couldn't log the match: ${error}`);
    }
    await supabase.from("match_submissions").update({ status: "approved", reviewed_by: adminUsername, reviewed_at: new Date().toISOString(), match_id: matchId }).eq("id", s.id);
    await logAdminAction(supabase, adminUsername, "approve_submission", { submission_id: s.id, match_id: matchId, reported_by: s.submitter_username });
    setBusy(null);
    fb.success("Approved — the match is on the ladder.");
    load();
  }

  async function reject(s: Sub) {
    const reason = await fb.prompt({ title: "Reject this report?", message: "The reporter will see it was rejected. Add a short reason.", placeholder: "e.g. no replay, wrong teams", confirmLabel: "Reject" });
    if (reason === null) return;
    setBusy(s.id);
    const { error } = await supabase.from("match_submissions").update({ status: "rejected", reviewed_by: adminUsername, reviewed_at: new Date().toISOString(), dispute_reason: s.dispute_reason ?? (reason || null) }).eq("id", s.id);
    setBusy(null);
    if (error) return fb.error(error.message);
    await logAdminAction(supabase, adminUsername, "reject_submission", { submission_id: s.id, reported_by: s.submitter_username, reason });
    load();
  }

  if (!subs) return <p className="text-sm" style={{ color: C.muted }}>Loading reports…</p>;
  if (!ready) {
    return (
      <p className="flex items-start gap-3 border p-4 text-sm" style={{ borderColor: C.amberDim, background: C.void, color: C.muted }}>
        <Info size={18} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />
        <span>Run <code style={{ color: C.amber }}>sql/match-submissions.sql</code> once in Supabase → SQL Editor to switch on player reports. Players report at <code style={{ color: C.amber }}>/report</code>.</span>
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm" style={{ color: C.muted }}>{subs.length === 0 ? "No reports waiting." : `${subs.length} waiting · confirmed ones first`}</span>
        <button type="button" onClick={load} className="inline-flex min-h-[40px] items-center gap-2 border px-3 text-xs uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.muted }}><RefreshCw size={14} aria-hidden="true" />Refresh</button>
      </div>
      <ul className="flex flex-col gap-3">
        {subs.map((s) => {
          const losers = s.participants.filter((p) => !s.winners.includes(p));
          const g = readGenerals(s.generals);
          const st = s.status === "confirmed" ? { c: C.radar, t: `Confirmed by ${s.confirmed_by}`, i: ShieldCheck } : s.status === "disputed" ? { c: LOSS, t: `Disputed by ${s.confirmed_by}`, i: Flag } : { c: C.amber, t: "Waiting for the other side", i: Clock };
          return (
            <li key={s.id} className="border" style={{ borderColor: s.status === "confirmed" ? "rgba(143,191,79,0.5)" : s.status === "disputed" ? "rgba(248,113,113,0.5)" : C.line, background: C.void }}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2 text-xs" style={{ borderColor: C.line, color: C.muted }}>
                <span className="uppercase tracking-widest" style={{ color: C.amber }}>{s.mode}</span>
                <span>{s.match_date}</span>
                {s.map && <span className="inline-flex items-center gap-1"><MapIcon size={11} aria-hidden="true" />{s.map}</span>}
                <span>reported by <b style={{ color: C.paper }}>{s.submitter_username}</b></span>
                <span className="ms-auto inline-flex items-center gap-1.5" style={{ color: st.c, fontWeight: 700 }}><st.i size={13} aria-hidden="true" />{st.t}</span>
              </div>
              <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-2">
                <div><span className="text-[11px] uppercase tracking-widest" style={{ color: C.radar }}>Winners</span><div style={{ fontWeight: 600 }}>{s.winners.map((p) => (g[p] ? `${p} · ${generalShort(g[p], "en")}` : p)).join(", ")}</div></div>
                <div><span className="text-[11px] uppercase tracking-widest" style={{ color: LOSS }}>Losers</span><div>{losers.map((p) => (g[p] ? `${p} · ${generalShort(g[p], "en")}` : p)).join(", ")}</div></div>
              </div>
              {(s.dispute_reason || s.notes || s.replay_url) && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 pb-3 text-xs">
                  {s.dispute_reason && <span style={{ color: LOSS }}>“{s.dispute_reason}”</span>}
                  {s.notes && <span style={{ color: C.muted }}>Note: {s.notes}</span>}
                  {s.replay_url && <a href={s.replay_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: C.amber }}><Link2 size={12} aria-hidden="true" />Replay</a>}
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3" style={{ borderColor: C.line }}>
                <button type="button" onClick={() => reject(s)} disabled={busy === s.id} className="inline-flex min-h-[40px] items-center gap-2 border px-4 text-xs uppercase tracking-widest disabled:opacity-50" style={{ borderColor: "rgba(248,113,113,0.6)", color: LOSS }}><X size={14} aria-hidden="true" />Reject</button>
                <button type="button" onClick={() => approve(s)} disabled={busy === s.id} className="inline-flex min-h-[40px] items-center gap-2 px-5 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: s.status === "confirmed" ? C.radar : C.amber, color: C.void, fontWeight: 700 }}>
                  {busy === s.id ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}Approve
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
