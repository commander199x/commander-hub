"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Crown } from "lucide-react";
import { useStream } from "@/lib/stream";

// Transparent overlay for OBS / Streamlabs: Browser Source → https://www.commander.host/live/overlay
// (suggested size 420 × 760). Shows the lobby and who's next, refreshing every few seconds.
export default function StreamOverlay() {
  const { lobby, queue, games, settings, avatars } = useStream(4000);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const king = games[0]?.ranking[0];
  const next = queue.slice(0, settings.size - 1);
  return createPortal(
    <div id="czov" style={{ position: "fixed", inset: 0, padding: 16, fontFamily: "Oswald, 'Arial Narrow', Impact, sans-serif", color: "#EDEAE0" }}>
      <style>{`html, body { background: transparent !important; } body > *:not(#czov) { display: none !important; }`}</style>
      <div style={{ width: 388, background: "rgba(10,12,8,0.82)", border: "1px solid #3A4029", borderTop: "3px solid #E8A63D" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #272B1E" }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, color: "#E8A63D" }}>STREAM LOBBY</span>
          <span style={{ fontSize: 13, color: "#8FBF4F", letterSpacing: 2 }}>{lobby.length}/{settings.size} · FFA</span>
        </div>
        <ol style={{ listStyle: "none", margin: 0, padding: 8, display: "grid", gap: 4 }}>
          {lobby.map((s) => (
            <li key={s.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", background: s.username === king && s.seat === 1 ? "rgba(232,166,61,0.18)" : "rgba(18,21,14,0.9)", borderLeft: `3px solid ${s.username === king && s.seat === 1 ? "#E8A63D" : "#3A4029"}` }}>
              <span style={{ width: 20, fontSize: 18, fontWeight: 700, color: "#83866F" }}>{s.seat}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatars[s.username] || "/default-avatar.svg"} alt="" width={28} height={28} style={{ borderRadius: 999, objectFit: "cover" }} />
              <span style={{ fontSize: 20, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.username}</span>
              {s.username === king && s.seat === 1 && <Crown size={18} color="#E8A63D" />}
            </li>
          ))}
        </ol>
        {next.length > 0 && (
          <>
            <div style={{ padding: "8px 14px 4px", fontSize: 14, letterSpacing: 3, color: "#8FBF4F", borderTop: "1px solid #272B1E" }}>NEXT UP</div>
            <div style={{ padding: "0 14px 12px", fontSize: 18, lineHeight: 1.5 }}>
              {next.map((q, i) => <span key={q.user_id}>{i > 0 && <span style={{ color: "#3A4029" }}> · </span>}{q.username}</span>)}
              {queue.length > next.length && <span style={{ color: "#83866F" }}> +{queue.length - next.length}</span>}
            </div>
          </>
        )}
        <div style={{ padding: "6px 14px", fontSize: 13, letterSpacing: 2, color: "#83866F", borderTop: "1px solid #272B1E" }}>JOIN: COMMANDER.HOST/LIVE</div>
      </div>
    </div>,
    document.body
  );
}
