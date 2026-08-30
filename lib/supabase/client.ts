// lib/supabase/client.ts
// Used in Client Components ("use client" files) to talk to Supabase
// from the browser (auth forms, profile edits, etc).

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
