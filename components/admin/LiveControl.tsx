"use client";

import { useEffect, useMemo, useState } from "react";
import { Radio, Square, Loader2, Info, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { logAdminAction } from "@/lib/auditLog";
import { useFeedback } from "@/components/FeedbackProvider";
import { readLive, isLiveNow, tiktokLiveUrl, type LiveState } from "@/lib/live";

const RED = "#DC2626";
const HOURS = [1, 2, 3, 4, 6];

// Admin switch for "we're live on TikTok": header LIVE badge + /live page (+ optional Discord post).
export default function LiveControl({ adminUsername }: { adminUsername: string }) {
  const supabase = useMemo(() => createClient(), []);
  const fb = useFeedback();
  const [state, setState] = useState<LiveState | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(3);
  const [announce, setAnnounce] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    readLive().then(setState);
  }, []);

  async function save(value: LiveState) {
    const { error } = await supabase.from("site_settings").upsert({ key: "live", value, updated_at: new Date().toISOString(), updated_by: adminUsername });
    if (error) throw new Error(error.message);
    setState(value);
  }

  async function goLive() {
    setBusy(true);
    try {
      const now = Date.now();
      const value: LiveState = { live: true, title: title.trim() || undefined, started_at: new Date(now).toISOString(), until: new Date(now + hours * 3600_000).toISOString() };
      await save(value);
      await logAdminAction(supabase, adminUsername, "go_live", { title: value.title, hours });
      if (announce) {
        const { data } = await supabase.auth.getSession();
        const res = await fetch("/api/live/announce", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ title: value.title, url: tiktokLiveUrl() }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) fb.error(`You're live on the site, but the Discord post failed: ${j.error ?? res.status}`);
      }
      fb.success("You're live — the LIVE badge is on.");
    } catch (e) {
      fb.error(`Couldn't go live: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  async function endLive() {
    setBusy(true);
    try {
      await save({ live: false });
      await logAdminAction(supabase, adminUsername, "end_live", {});
      fb.success("Stream ended — the LIVE badge is off.");
    } catch (e) {
      fb.error(`Couldn't end the stream: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  if (state === undefined) return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  if (state === null) {
    return (
      <p className="flex items-start gap-3 border p-4 text-sm" style={{ borderColor: C.amberDim, background: C.void, color: C.muted }}>
        <Info size={18} className="mt-0.5 shrink-0" style={{ color: C.amber }} aria-hidden="true" />
        <span>Run <code style={{ color: C.amber }}>sql/site-settings.sql</code> once in Supabase → SQL Editor to switch this on.</span>
      </p>
    );
  }

  const live = isLiveNow(state);
  return live ? (
    <div className="flex flex-wrap items-center gap-4 border p-5" style={{ borderColor: RED, background: "linear-gradient(140deg, rgba(220,38,38,0.12), #0A0C08 60%)" }}>
      <span className="inline-flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white" style={{ background: RED, fontWeight: 800 }}><Radio size={14} aria-hidden="true" />Live</span>
      <div className="min-w-0 flex-1 text-sm">
        <div style={{ fontWeight: 700 }}>{state.title || "Live on TikTok"}</div>
        <div style={{ color: C.muted }}>Auto-off at {state.until ? new Date(state.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}</div>
      </div>
      <a href={tiktokLiveUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest" style={{ borderColor: C.lineStrong, color: C.paper }}>Open stream <ExternalLink size={13} aria-hidden="true" /></a>
      <button type="button" onClick={endLive} disabled={busy} className="inline-flex min-h-[44px] items-center gap-2 px-5 text-xs uppercase tracking-widest text-white disabled:opacity-50" style={{ background: RED, fontWeight: 700 }}>
        {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Square size={14} aria-hidden="true" />}End stream
      </button>
    </div>
  ) : (
    <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
      <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Stream title (optional)</span>
        <input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 4v4 clan night" className="min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]" />
      </label>
      <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Auto-off after</span>
        <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="min-h-[44px] border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0]">
          {HOURS.map((h) => <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>)}
        </select>
      </label>
      <label className="inline-flex min-h-[44px] items-center gap-2 text-sm" style={{ color: C.paper }}>
        <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} style={{ accentColor: C.amber, width: 16, height: 16 }} />
        Post on Discord
      </label>
      <button type="button" onClick={goLive} disabled={busy} className="inline-flex min-h-[44px] items-center justify-center gap-2 px-6 text-xs uppercase tracking-widest text-white disabled:opacity-50" style={{ background: RED, fontWeight: 800 }}>
        {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Radio size={14} aria-hidden="true" />}Go live
      </button>
    </div>
  );
}
