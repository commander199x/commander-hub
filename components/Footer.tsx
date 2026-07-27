import { C, DISCORD_URL, SUPPORT_DISCORD_URL } from "@/lib/theme";

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.line}` }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs uppercase tracking-widest">
        <span style={{ color: C.muted }}>
          &copy; {new Date().getFullYear()} Commander &middot; Generals Zero Hour Community
        </span>

        <div className="flex items-center gap-6">
          <a href={SUPPORT_DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.amber }}>
            Support
          </a>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.paper }}>
            Discord
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: C.paper }}>
            YouTube
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style={{ color: C.paper }}>
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}
