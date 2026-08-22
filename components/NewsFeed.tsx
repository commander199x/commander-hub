"use client";

import { Megaphone, CalendarDays } from "lucide-react";
import { C } from "@/lib/theme";
import { posts, type Post } from "@/lib/news-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function formatDate(dateStr: string, locale: "en" | "ar"): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PostCard({ post }: { post: Post }) {
  const { locale } = useLanguage();
  const Icon = post.type === "Event" ? CalendarDays : Megaphone;
  const content = (
    <div className="cz-card group relative p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map(
        (pos) => (
          <span
            key={pos}
            className={`cz-bracket pointer-events-none absolute w-3 h-3 ${pos} opacity-0 transition-opacity duration-300`}
            style={{ borderColor: C.amber }}
          />
        )
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ color: post.type === "Event" ? C.radar : C.amber }}>
          <Icon size={13} />
          {post.type}
        </span>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>
          {formatDate(post.date, locale)}
        </span>
      </div>

      <h3 className="text-[15px]" style={{ color: C.paper, fontWeight: 500 }}>
        {post.title}
      </h3>

      <p className="text-xs mt-2" style={{ color: C.muted }}>
        {post.description}
      </p>
    </div>
  );

  return post.link ? (
    <a href={post.link} target={post.link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
}

export default function NewsFeed({ limit }: { limit?: number }) {
  const { t } = useLanguage();
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
  const shown = limit ? sorted.slice(0, limit) : sorted;

  if (shown.length === 0) {
    return (
      <p className="text-xs uppercase tracking-widest" style={{ color: C.muted }}>
        {t("news.nothingPosted")}
      </p>
    );
  }

  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {shown.map((post) => (
        <PostCard key={post.title} post={post} />
      ))}
    </section>
  );
}
