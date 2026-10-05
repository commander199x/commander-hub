// Shared pieces for the link-preview cards (Discord, WhatsApp, X…).
import { createClient } from "@supabase/supabase-js";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG = {
  void: "#0A0C08", panel: "#12150E", line: "#272B1E", amber: "#E8A63D", amberDim: "#8A6425",
  radar: "#8FBF4F", paper: "#EDEAE0", muted: "#83866F", silver: "#C9CCC0", bronze: "#B87333",
};

export function ogDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** The site's Oswald font for just the characters on the card; null if Google Fonts is unreachable. */
export async function loadOswald(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Oswald:wght@700&text=${encodeURIComponent(text)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function ogFonts(text: string) {
  const data = await loadOswald(text);
  return {
    heading: data ? "Oswald" : "sans-serif",
    fonts: data ? [{ name: "Oswald", data, weight: 700 as const, style: "normal" as const }] : undefined,
  };
}

/** Background + top bar every card shares. */
export function OgFrame({ label, heading, children }: { label: string; heading: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column", color: OG.paper, padding: "52px 64px", fontFamily: "sans-serif",
        background: `radial-gradient(ellipse 60% 70% at 85% 25%, rgba(143,191,79,0.15), transparent 60%), radial-gradient(ellipse 55% 60% at 10% 100%, rgba(232,166,61,0.18), transparent 60%), ${OG.void}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, border: `2px solid ${OG.radar}`, display: "flex" }} />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2, color: OG.amber, fontFamily: heading }}>COMMANDER</div>
        </div>
        <div style={{ fontSize: 20, letterSpacing: 6, color: OG.radar }}>{label}</div>
      </div>
      {children}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 20, color: OG.muted }}>
        <div style={{ display: "flex" }}>Generals Zero Hour ranked community</div>
        <div style={{ display: "flex", color: OG.amberDim }}>www.commander.host</div>
      </div>
    </div>
  );
}

export function OgAvatar({ src, name, size, ring }: { src: string | null | undefined; name: string; size: number; ring: string }) {
  return (
    <div style={{ display: "flex", width: size, height: size, borderRadius: 999, padding: 4, background: ring }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} width={size - 8} height={size - 8} style={{ borderRadius: 999, objectFit: "cover", border: `4px solid ${OG.void}` }} />
      ) : (
        <div style={{ width: size - 8, height: size - 8, borderRadius: 999, background: OG.panel, border: `4px solid ${OG.void}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 800, color: ring }}>
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}
