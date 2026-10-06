// Who is on the site right now. One shared "site-presence" channel is joined by
// <SitePresence /> in the header (exactly once); any page can read the list with useOnlinePlayers().
"use client";

import { useEffect, useState } from "react";

export type OnlinePlayer = { username: string; page: string; since: string };

let current: OnlinePlayer[] = [];
const listeners = new Set<(v: OnlinePlayer[]) => void>();

export function setOnlinePlayers(v: OnlinePlayer[]) {
  current = v;
  listeners.forEach((l) => l(v));
}

export function useOnlinePlayers() {
  const [v, setV] = useState<OnlinePlayer[]>(current);
  useEffect(() => {
    listeners.add(setV);
    setV(current);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}
