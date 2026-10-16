// Remembers "I want to join the stream queue" across logging in (password or Discord),
// so a viewer who has to sign in first is brought straight back and joined automatically.
const KEY = "cz-join-queue";
const FRESH_MS = 30 * 60 * 1000;

export function rememberJoin() {
  try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode: ignore */ }
}
export function wantsJoin(): boolean {
  try {
    const t = Number(localStorage.getItem(KEY));
    return Number.isFinite(t) && Date.now() - t < FRESH_MS;
  } catch { return false; }
}
export function forgetJoin() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
