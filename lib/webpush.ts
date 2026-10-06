// Server-only: sends a "ping" push to a phone/browser using VAPID (no extra packages needed).
// The push carries no data; the app's service worker shows "New activity — tap to open".
// Keys come from Vercel env vars made by `node scripts/generate-vapid-keys.js`:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. mailto:you@example.com)
import { createPrivateKey, sign } from "node:crypto";

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export function pushConfigured() {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function vapidJwt(audience: string) {
  const pub = fromB64url(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!); // 65 bytes: 0x04 | x | y
  const key = createPrivateKey({
    format: "jwk",
    key: { kty: "EC", crv: "P-256", d: process.env.VAPID_PRIVATE_KEY!, x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33, 65)) },
  });
  const header = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(Buffer.from(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: process.env.VAPID_SUBJECT || "mailto:admin@commander.host" })));
  const signature = sign("sha256", Buffer.from(`${header}.${claims}`), { key, dsaEncoding: "ieee-p1363" });
  return `${header}.${claims}.${b64url(signature)}`;
}

/** Sends an empty push to each endpoint. Returns how many were accepted. */
export async function sendPings(endpoints: string[]): Promise<number> {
  if (!pushConfigured()) return 0;
  let ok = 0;
  await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { TTL: "86400", Urgency: "high", "Content-Length": "0", Authorization: `vapid t=${vapidJwt(new URL(endpoint).origin)}, k=${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}` },
        });
        if (res.ok) ok++;
      } catch {
        // a phone that unsubscribed or is unreachable — ignore
      }
    })
  );
  return ok;
}
