"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const NAV = [
    { label: t("nav.home"), href: "/" },
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

<a            href={DISCORD_URL}
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

<a           href={DISCORD_URL}
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
