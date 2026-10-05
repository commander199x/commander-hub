import type { MetadataRoute } from "next";

// Lets players install Commander as an app (home screen icon, full screen, own window).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Commander | Generals Zero Hour Community",
    short_name: "Commander",
    description: "Ranked ladders, tournaments, replays and the Commander clan for Generals Zero Hour.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0C08",
    theme_color: "#0A0C08",
    categories: ["games", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Leaderboard", url: "/leaderboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Tournaments", url: "/tournaments", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Chat", url: "/chat", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
