// Client helpers for Find a game.
"use client";

import { createClient } from "@/lib/supabase/client";

export type PlayMode = "1v1" | "2v2" | "3v3" | "4v4" | "ffa";
export const PLAY_MODES: PlayMode[] = ["1v1", "2v2", "3v3", "4v4", "ffa"];

export type Challenge = {
  id: string; created_at: string; from_user: string; from_username: string; to_user: string; to_username: string;
  mode: PlayMode; message: string | null; status: "pending" | "accepted" | "declined" | "cancelled"; responded_at: string | null; expires_at: string;
};
export type ReadyPlayer = { user_id: string; username: string; modes: PlayMode[]; note: string | null; until: string; updated_at: string };

/** Tell the server to ping phones / post to Discord. Never blocks the UI; failures are ignored. */
export async function notifyServer(kind: "challenge" | "ready", id?: string, discord = true) {
  try {
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/api/play/notify", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ kind, id, discord }) });
  } catch {}
}

export async function sendChallenge(to: string, mode: PlayMode, message: string, discord: boolean) {
  const { data, error } = await createClient().rpc("send_challenge", { p_to: to, p_mode: mode, p_message: message || null });
  if (error) return { error: error.message };
  void notifyServer("challenge", data as string, discord);
  return { error: null };
}

// ---- phone notifications ----
export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(b64: string) {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export async function currentPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return "Phone notifications aren't supported here. On iPhone, install the app to your home screen first.";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "Notifications are blocked — allow them in your browser or phone settings.";
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) }));
  const j = sub.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } };
  const { error } = await createClient().from("push_subscriptions").upsert({ endpoint: j.endpoint, p256dh: j.keys?.p256dh ?? null, auth: j.keys?.auth ?? null });
  return error ? error.message : null;
}

export async function disablePush() {
  const sub = await currentPushSubscription();
  if (!sub) return;
  await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}
