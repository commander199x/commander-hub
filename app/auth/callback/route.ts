import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Discord (and any future OAuth provider) redirects back here after the
// user approves the login. This exchanges the temporary code for a real
// session, then sends them back to the homepage, logged in.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong (e.g. user cancelled) — send them to login with a
  // message instead of a broken page.
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
