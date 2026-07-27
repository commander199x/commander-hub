"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { C, DISCORD_URL } from "@/lib/theme";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Replays", href: "/replays" },
  { label: "Downloads", href: "/downloads" },
  { label: "Videos", href: "/videos" },
  { label: "Tournaments", href: "/tournaments" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

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
            <Link key={item.label} href={item.href} className="cz-nav-link" style={{ color: C.paper }}>
              {item.label}
            </Link>
          ))}
          
<a            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest px-4 py-2 transition-opacity hover:opacity-90"
            style={{ background: C.amber, color: C.void, fontWeight: 600 }}
          >
            Join clan
          </a>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          style={{ color: C.paper }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden flex flex-col gap-1 px-6 py-4 text-xs uppercase tracking-widest"
          style={{ borderTop: `1px solid ${C.line}`, background: C.void }}
        >
          {NAV.map((item) => (
            <Link
              key={item.label}
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
            Join clan
          </a>
        </div>
      )}
    </header>
  );
}