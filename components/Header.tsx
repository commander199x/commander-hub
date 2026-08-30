"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const supabase = createClient();

  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        setUsername(profile?.username ?? null);
        setAvatarUrl(profile?.avatar_url ?? null);
      } else {
        setUsername(null);
        setAvatarUrl(null);
      }

      setAuthLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUsername(null);
    setOpen(false);
  }

  const NAV = [
    { label: t("nav.home"), href: "/" },
    { label: "CHAT", href: "/chat" },
    { label: t("nav.replays"), href: "/replays" },
    { label: t("nav.downloads"), href: "/downloads" },
    { label: t("nav.videos"), href: "/videos" },
    { label: t("nav.tournaments"), href: "/tournaments" },
  ];

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: `${C.void}F2`, backdropFilter: "blur(6px)", borderBottom: `1px solid ${C.line}` }}
    >
      <div className="flex justify-between items-center px-6 md:px-10 py-5">
        <Link href="/" className="cz-display uppercase text-xl tracking-wide" style={{ color: C.amber, fontWeight: 700 }}>
          Commander
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest" style={{ color: C.muted }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="cz-nav-link" style={{ color: C.paper }}>
              {item.label}
            </Link>
          ))}

          <LanguageSwitcher />

          {!authLoading && (
            username ? (
              <>
                <Link
                  href={`/profile/${username}`}
                  className="cz-nav-link"
                  style={{ color: C.paper, display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <img
                    src={avatarUrl || "/default-avatar.svg"}
                    alt={username}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `1px solid ${C.amber}`,
                    }}
                  />
                  {username.toUpperCase()}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="cz-nav-link"
                  style={{ color: C.muted, background: "none", border: "none", cursor: "pointer" }}
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="cz-nav-link"
                style={{ color: C.paper }}
              >
                SIGN IN
              </Link>
            )
          )}

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest px-4 py-2 transition-opacity hover:opacity-90"
            style={{ background: C.amber, color: C.void, fontWeight: 600 }}
          >
            {t("common.joinClan")}
          </a>
        </nav>

        <div className="md:hidden flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
            aria-expanded={open}
            style={{ color: C.paper }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden flex flex-col gap-1 px-6 py-4 text-xs uppercase tracking-widest"
          style={{ borderTop: `1px solid ${C.line}`, background: C.void }}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-3"
              style={{ color: C.paper, borderBottom: `1px solid ${C.line}` }}
            >
              {item.label}
            </Link>
          ))}

          {!authLoading && (
            username ? (
              <>
                <Link
                  href={`/profile/${username}`}
                  onClick={() => setOpen(false)}
                  className="py-3"
                  style={{ color: C.paper, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <img
                    src={avatarUrl || "/default-avatar.svg"}
                    alt={username}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `1px solid ${C.amber}`,
                    }}
                  />
                  {username.toUpperCase()}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="py-3 text-left"
                  style={{ color: C.muted, background: "none", border: "none", borderBottom: `1px solid ${C.line}` }}
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-3"
                style={{ color: C.paper, borderBottom: `1px solid ${C.line}` }}
              >
                SIGN IN
              </Link>
            )
          )}

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-center mt-4 px-4 py-3"
            style={{ background: C.amber, color: C.void, fontWeight: 600 }}
          >
            {t("common.joinClan")}
          </a>
        </div>
      )}
    </header>
  );
}
