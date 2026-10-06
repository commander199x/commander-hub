// "We're live on TikTok" state, stored in site_settings (key = "live").
// TikTok doesn't let websites embed live streams or check live status, so an admin flips the switch.
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TIKTOK_URL } from "@/lib/theme";

export type LiveState = { live: boolean; title?: string; started_at?: string; until?: string };

export const tiktokLiveUrl = () => `${(TIKTOK_URL || "https://www.tiktok.com").replace(/\/+$/, "").replace(/\/live$/, "")}/live`;

/** Live only while switched on AND before the auto-off time. */
export function isLiveNow(v: LiveState | null | undefined) {
  return !!v?.live && (!v.until || Date.parse(v.until) > Date.now());
}

export async function readLive(): Promise<LiveState | null> {
  const { data, error } = await createClient().from("site_settings").select("value").eq("key", "live").maybeSingle();
  if (error || !data) return null;
  return (data as { value: LiveState }).value ?? null;
}

/** Live state for the page; re-checks every minute and when the tab comes back into view. */
export function useLive() {
  const [state, setState] = useState<LiveState | null>(null);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => readLive().then((v) => !cancelled && setState(v));
    refresh();
    const t = setInterval(refresh, 60_000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return { state, live: isLiveNow(state) };
}
