// Flip this to true when you're live, and fill in the link to your stream.
// Flip back to false when the stream ends.
export const LIVE_STATUS = {
  isLive: false,
  link: "https://www.youtube.com/@yourhandle/live", // TODO: replace with your real live URL
  title: "TODO — stream title when live",
};

export type PostType = "News" | "Event";

export interface Post {
  type: PostType;
  title: string;
  date: string; // e.g. "2026-08-02" — used for sorting, shown formatted
  description: string;
  link?: string;
}

// Newest first. Add entries here any time you have an update or event —
// same manual pattern as the TikTok video list and mods list.
export const posts: Post[] = [
  {
    type: "Event",
    title: "Commander Tournament 2026 registration opens",
    date: "2026-08-10",
    description: "Sign-ups open for the 1v1 and team brackets. Limited slots.",
    link: "/tournaments",
  },
  {
    type: "News",
    title: "Shockwave mod updated to v2.6.2",
    date: "2026-07-28",
    description: "Balance pass on GLA units, several crash fixes. Grab it from Downloads.",
    link: "/downloads",
  },
];