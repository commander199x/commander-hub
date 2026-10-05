import { DISCORD_URL, YOUTUBE_URL, TIKTOK_URL } from "@/lib/theme";

// Tells Google what Commander is (organization + website). Shown in search results, never on the page.
const SITE_URL = "https://www.commander.host";

export default function SiteJsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Commander",
      alternateName: "Commander Clan",
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      description: "Generals Zero Hour ranked community and clan: ladders, tournaments, replays, maps and strategy guides.",
      sameAs: [DISCORD_URL, YOUTUBE_URL, TIKTOK_URL].filter(Boolean),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Commander | Generals Zero Hour Community",
      url: SITE_URL,
      inLanguage: ["en", "ar"],
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
