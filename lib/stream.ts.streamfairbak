// Livestream FFA queue: lobby seats, waiting list, history and settings — refreshed every few seconds.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type StreamSettings = { open: boolean; size: number; requeue: boolean };
export type LobbySeat = { user_id: string; username: string; seat: number; games: number; joined_at: string };
export type QueueEntry = { user_id: string; username: string; joined_at: string };
export type StreamGame = { id: number; created_at: string; ranking: string[]; stayed: string[]; joined: string[]; removed: string[] };

export const DEFAULT_STREAM: StreamSettings = { open: false, size: 7, requeue: true };

/** The exact rule the database uses: the winner stays; N waiting replace the bottom N (max seats-1). */
export function previewRotation(ranking: string[], waiting: string[], seats: number) {
  const newcomers = Math.min(waiting.length, seats - 1);
  const keepCount = Math.max(1, Math.min(ranking.length, seats - newcomers));
  const stay = ranking.slice(0, keepCount);
  const out = ranking.slice(keepCount);
  const join = waiting.slice(0, seats - stay.length);
  return { stay, out, join };
}

export function useStream(pollMs = 5000) {
  const supabase = useMemo(() => createClient(), []);
  const [settings, setSettings] = useState<StreamSettings>(DEFAULT_STREAM);
  const [lobby, setLobby] = useState<LobbySeat[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [games, setGames] = useState<StreamGame[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [ready, setReady] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const [s, l, q, g] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", "stream").maybeSingle(),
      supabase.from("stream_lobby").select("*").order("seat"),
      supabase.from("stream_queue").select("*").order("joined_at").order("username"),
      supabase.from("stream_games").select("*").order("id", { ascending: false }).limit(5),
    ]);
    if (l.error || q.error) return setReady(false);
    setReady(true);
    setSettings({ ...DEFAULT_STREAM, ...(((s.data as { value?: Partial<StreamSettings> } | null)?.value) ?? {}) });
    const lob = (l.data ?? []) as LobbySeat[];
    const que = (q.data ?? []) as QueueEntry[];
    setLobby(lob);
    setQueue(que);
    setGames(g.error ? [] : ((g.data ?? []) as StreamGame[]));
    const names = [...lob, ...que].map((x) => x.username).filter((n) => !(n in avatars));
    if (names.length) {
      const { data } = await supabase.from("profiles").select("username, avatar_url").in("username", names);
      setAvatars((a) => ({ ...a, ...Object.fromEntries(((data ?? []) as { username: string; avatar_url: string | null }[]).map((p) => [p.username, p.avatar_url])) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, pollMs);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh, pollMs]);

  return { supabase, settings, lobby, queue, games, avatars, ready, refresh };
}
