"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setOnlinePlayers, type OnlinePlayer } from "@/lib/presence";

// Shares "I'm on the site" (signed-in players only) so Find a game can show who's online.
// Rendered ONCE, inside the header. Renders nothing.
export default function SitePresence() {
  const supabase = useMemo(() => createClient(), []);
  const path = usePathname() || "/";

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      let username: string | null = null;
      if (user) {
        const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
        username = (data as { username?: string } | null)?.username ?? null;
      }
      if (cancelled) return;
      channel = supabase.channel("site-presence", { config: { presence: { key: user?.id ?? crypto.randomUUID() } } });
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState() as Record<string, OnlinePlayer[]>;
          const seen = new Map<string, OnlinePlayer>();
          for (const entries of Object.values(state)) for (const e of entries) if (e?.username && !seen.has(e.username)) seen.set(e.username, e);
          setOnlinePlayers(Array.from(seen.values()).sort((a, b) => a.username.localeCompare(b.username)));
        })
        .subscribe(async (status) => {
          // visitors who aren't signed in listen only; they don't appear in the list
          if (status === "SUBSCRIBED" && username) await channel!.track({ username, page: window.location.pathname, since: new Date().toISOString() });
        });
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // re-announce the current page when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, path]);

  return null;
}
