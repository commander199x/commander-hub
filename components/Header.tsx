"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, ChevronDown, UserRound, Pencil, LogOut, ArrowUpRight } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import "@/app/notifications.css";
import "@/app/animations.css";

// Arabic needs a native review.
const TEXT = {
  en: { chat: "Chat", members: "Members", leaderboard: "Leaderboard", profile: "My profile", edit: "Edit profile", owner: "Owner", menu: "Menu" },
  ar: { chat: "الدردشة", members: "الأعضاء", leaderboard: "لوحة الصدارة", profile: "ملفي", edit: "تعديل الملف", owner: "المالك", menu: "القائمة" },
};

const CSS = `
@keyframes czh2-sweep { to { transform: rotate(360deg); } }
@keyframes czh2-drop { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes czh2-item { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
@keyframes czh2-fade { from { opacity: 0; } to { opacity: 1; } }
.czh2-sweep { animation: czh2-sweep 3.5s linear infinite; }
.czh2-drop { animation: czh2-drop 0.2s ease-out both; }
.czh2-item { animation: czh2-item 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
[dir="rtl"] .czh2-item { animation-name: czh2-fade; }
.czh2-overlay { animation: czh2-fade 0.25s ease both; }
.czh2-link { position: relative; transition: color 0.2s ease; }
.czh2-link:hover { color: #E8A63D !important; }
.czh2-underline { transition: left 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), width 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.2s ease; }
.czh2-logo:hover .czh2-word { text-shadow: 0 0 18px rgba(232,166,61,0.55); }
/* Sticky toolbars on pages sit just below the header instead of underneath it */
main .sticky.top-0 { top: var(--cz-header-h, 0px); }
@media (prefers-reduced-motion: reduce) {
  .czh2-sweep, .czh2-drop, .czh2-item, .czh2-overlay { animation: none !important; }
  .czh2-underline { transition: none !important; }
}
`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t, locale } = useLanguage();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = TEXT[lang];
  const supabase = createClient();
  const pathname = usePathname() || "/";

  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userMenu, setUserMenu] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [underline, setUnderline] = useState({ left: 0, width: 0, show: false });

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url, is_owner")
          .eq("id", user.id)
          .single();

        setUsername(profile?.username ?? null);
        setAvatarUrl(profile?.avatar_url ?? null);
        setIsOwner(profile?.is_owner ?? false);
      } else {
        setUsername(null);
        setAvatarUrl(null);
        setIsOwner(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUsername(null);
    setOpen(false);
    setUserMenu(false);
  }

  // Shrink + solidify on scroll, and draw a reading-progress line
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 12);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, y / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Publish the header height so sticky page toolbars sit right below it
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--cz-header-h", `${el.offsetHeight}px`);
    set();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close menus when the page changes
  useEffect(() => {
    setOpen(false);
    setUserMenu(false);
  }, [pathname]);

  // Mobile menu: lock scroll + Esc to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // User dropdown: click outside / Esc closes
  useEffect(() => {
    if (!userMenu) return;
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUserMenu(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenu]);

  const NAV = [
    { label: t("nav.home"), href: "/" },
    { label: tx.leaderboard, href: "/leaderboard" },
    { label: t("nav.tournaments"), href: "/tournaments" },
    { label: t("nav.replays"), href: "/replays" },
    { label: t("nav.videos"), href: "/videos" },
    { label: t("nav.downloads"), href: "/downloads" },
    { label: tx.members, href: "/members" },
    { label: tx.chat, href: "/chat" },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  const activeHref = NAV.find((n) => isActive(n.href))?.href ?? null;

  // Sliding underline under the current page
  useLayoutEffect(() => {
    const measure = () => {
      const el = activeHref ? linkRefs.current[activeHref] : null;
      const nav = navRef.current;
      if (!el || !nav) return setUnderline((u) => ({ ...u, show: false }));
      const a = el.getBoundingClientRect();
      const b = nav.getBoundingClientRect();
      setUnderline({ left: a.left - b.left, width: a.width, show: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeHref, lang, username]);

  const avatar = (size: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl || "/default-avatar.svg"}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, border: `1px solid ${C.amber}` }}
    />
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300"
      style={{
        background: scrolled ? "rgba(10,12,8,0.94)" : "rgba(10,12,8,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${scrolled ? C.lineStrong : C.line}`,
        boxShadow: scrolled ? "0 10px 30px rgba(0,0,0,0.35)" : "none",
      }}
    >
      <style>{CSS}</style>

      <div className={`flex items-center justify-between gap-6 px-6 transition-[padding] duration-300 md:px-10 ${scrolled ? "py-2.5" : "py-4"}`}>
        {/* Logo with live mini-radar */}
        <Link href="/" className="czh2-logo flex shrink-0 items-center gap-2.5" aria-label="Commander home">
          <span className="relative inline-block h-6 w-6 overflow-hidden rounded-full" style={{ border: `1px solid ${C.radar}` }} aria-hidden="true">
            <span className="absolute inset-[30%] rounded-full" style={{ border: `1px solid rgba(143,191,79,0.4)` }} />
            <span className="czh2-sweep absolute inset-0" style={{ background: "conic-gradient(from 0deg, rgba(143,191,79,0) 0deg, rgba(143,191,79,0) 270deg, rgba(143,191,79,0.85) 360deg)" }} />
          </span>
          <span className="czh2-word cz-display text-xl uppercase tracking-wide transition-[text-shadow] duration-300" style={{ color: C.amber, fontWeight: 700 }}>
            Commander
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-end gap-6 lg:flex" aria-label="Main">
          <div ref={navRef} className="relative flex items-center gap-5 xl:gap-7">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    linkRefs.current[item.href] = el;
                  }}
                  aria-current={active ? "page" : undefined}
                  className="czh2-link py-2 text-[11px] uppercase tracking-[0.16em]"
                  style={{ color: active ? C.amber : C.paper, fontWeight: active ? 700 : 500 }}
                >
                  {item.label}
                </Link>
              );
            })}
            <span
              aria-hidden="true"
              className="czh2-underline pointer-events-none absolute -bottom-0.5 h-[2px]"
              style={{ left: underline.left, width: underline.width, opacity: underline.show ? 1 : 0, background: C.amber, boxShadow: "0 0 10px rgba(232,166,61,0.7)" }}
            />
          </div>

          <span className="h-5 w-px" style={{ background: C.line }} aria-hidden="true" />
          <LanguageSwitcher />

        </nav>

        {/* Right side: ONE notification bell for all screen sizes (it opens a realtime channel,
            so it must never be rendered twice), then account + Join on desktop */}
        <div className="ms-auto flex shrink-0 items-center gap-3 lg:ms-0">
          {!authLoading && username && <NotificationBell />}
          <div className="hidden items-center gap-3 lg:flex">
          {!authLoading &&
            (username ? (
              <>
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenu((v) => !v)}
                    aria-expanded={userMenu}
                    aria-haspopup="menu"
                    className="flex min-h-[40px] items-center gap-2 border px-2 text-[11px] uppercase tracking-[0.12em] transition-colors hover:bg-[#171B10]"
                    style={{ borderColor: userMenu ? C.amberDim : "transparent", color: C.paper }}
                  >
                    {avatar(26)}
                    <span className="max-w-[120px] truncate">{username}</span>
                    {isOwner && (
                      <span className="px-1 py-px text-[9px] tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                        {tx.owner}
                      </span>
                    )}
                    <ChevronDown size={14} className="transition-transform" style={{ transform: userMenu ? "rotate(180deg)" : "none", color: C.muted }} aria-hidden="true" />
                  </button>
                  {userMenu && (
                    <div role="menu" className="czh2-drop absolute end-0 top-full z-50 mt-2 w-52 border py-1" style={{ background: C.panel, borderColor: C.amberDim, boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                      <Link role="menuitem" href={`/profile/${username}`} className="flex min-h-[42px] items-center gap-3 px-4 text-sm hover:bg-[#171B10]" style={{ color: C.paper }}>
                        <UserRound size={15} style={{ color: C.amber }} aria-hidden="true" />
                        {tx.profile}
                      </Link>
                      <Link role="menuitem" href="/profile/edit" className="flex min-h-[42px] items-center gap-3 px-4 text-sm hover:bg-[#171B10]" style={{ color: C.paper }}>
                        <Pencil size={15} style={{ color: C.amber }} aria-hidden="true" />
                        {tx.edit}
                      </Link>
                      <div className="my-1 h-px" style={{ background: C.line }} />
                      <button role="menuitem" onClick={handleSignOut} className="flex min-h-[42px] w-full items-center gap-3 px-4 text-start text-sm hover:bg-[#171B10]" style={{ color: C.muted }}>
                        <LogOut size={15} className="rtl:-scale-x-100" aria-hidden="true" />
                        {t("common.signOut")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-[40px] items-center gap-1.5 border px-4 text-[11px] uppercase tracking-[0.14em] transition-colors hover:bg-[#171B10]"
                style={{ borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}
              >
                <LogIn size={14} className="rtl:-scale-x-100" aria-hidden="true" />
                {t("common.signIn")}
              </Link>
            ))}

          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center gap-1.5 px-4 text-[11px] uppercase tracking-[0.14em] transition-[filter,box-shadow] hover:brightness-110"
            style={{ background: C.amber, color: C.void, fontWeight: 700, boxShadow: "0 0 20px rgba(232,166,61,0.25)" }}
          >
            {t("common.joinClan")}
            <ArrowUpRight size={13} className="rtl:-scale-x-100" aria-hidden="true" />
          </a>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
            aria-expanded={open}
            className="inline-flex h-11 w-11 items-center justify-center"
            style={{ color: C.paper }}
          >
            {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Reading-progress line */}
      <span
        aria-hidden="true"
        className="absolute bottom-[-1px] h-[2px]"
        style={{ insetInlineStart: 0, width: `${progress * 100}%`, background: `linear-gradient(90deg, ${C.amberDim}, ${C.amber})`, boxShadow: progress > 0 ? "0 0 8px rgba(232,166,61,0.6)" : "none" }}
      />

      {/* Mobile menu: full screen */}
      {open && (
        <div className="czh2-overlay fixed inset-x-0 bottom-0 z-40 overflow-y-auto lg:hidden" style={{ top: "var(--cz-header-h, 64px)", background: "rgba(10,12,8,0.98)" }}>
          <nav className="flex flex-col px-6 pb-10 pt-4" aria-label={tx.menu}>
            {NAV.map((item, i) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="czh2-item cz-display flex min-h-[58px] items-center justify-between border-b text-3xl uppercase"
                  style={{ animationDelay: `${i * 0.04}s`, borderColor: C.line, color: active ? C.amber : C.paper, fontWeight: 600 }}
                >
                  {item.label}
                  {active && <span className="h-2 w-2 rounded-full" style={{ background: C.amber, boxShadow: "0 0 10px #E8A63D" }} aria-hidden="true" />}
                </Link>
              );
            })}

            {!authLoading &&
              (username ? (
                <div className="czh2-item mt-6 flex flex-col gap-1" style={{ animationDelay: `${NAV.length * 0.04}s` }}>
                  <Link href={`/profile/${username}`} onClick={() => setOpen(false)} className="flex min-h-[56px] items-center gap-3 border px-4" style={{ borderColor: C.line, background: C.panel, color: C.paper }}>
                    {avatar(34)}
                    <span className="min-w-0 flex-1 truncate text-base" style={{ fontWeight: 600 }}>{username}</span>
                    {isOwner && (
                      <span className="px-1.5 py-px text-[10px] uppercase tracking-widest" style={{ background: C.amber, color: C.void, fontWeight: 700 }}>
                        {tx.owner}
                      </span>
                    )}
                  </Link>
                  <div className="grid grid-cols-2 gap-1">
                    <Link href="/profile/edit" onClick={() => setOpen(false)} className="flex min-h-[48px] items-center justify-center gap-2 border text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.paper }}>
                      <Pencil size={14} aria-hidden="true" />
                      {tx.edit}
                    </Link>
                    <button onClick={handleSignOut} className="flex min-h-[48px] items-center justify-center gap-2 border text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.muted }}>
                      <LogOut size={14} className="rtl:-scale-x-100" aria-hidden="true" />
                      {t("common.signOut")}
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="czh2-item mt-6 inline-flex min-h-[52px] items-center justify-center gap-2 border text-sm uppercase tracking-widest"
                  style={{ animationDelay: `${NAV.length * 0.04}s`, borderColor: C.amberDim, color: C.paper, fontWeight: 600 }}
                >
                  <LogIn size={16} className="rtl:-scale-x-100" aria-hidden="true" />
                  {t("common.signIn")}
                </Link>
              ))}

            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="czh2-item mt-3 inline-flex min-h-[56px] items-center justify-center gap-2 text-sm uppercase tracking-widest"
              style={{ animationDelay: `${(NAV.length + 1) * 0.04}s`, background: C.amber, color: C.void, fontWeight: 700 }}
            >
              {t("common.joinClan")}
              <ArrowUpRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
