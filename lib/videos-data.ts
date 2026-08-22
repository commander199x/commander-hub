export interface ManualVideo {
  title: string;
  platform: "TikTok";
  description: string;
  category?: string;
  thumbnail: string | null;
  link: string;
}

// TikTok doesn't offer a public feed for pulling a creator's videos without
// going through their official Developer API (OAuth + app review), so these
// are added by hand. To add a new TikTok, just add another object below.
export const tiktokVideos: ManualVideo[] = [
  {
    title: "Commander TIKTOK page",
    platform: "TikTok",
    description: "Follow Us On Tiktok For Every LiveStream",
    category: "Clips",
    thumbnail: null,
    link: "https://www.tiktok.com/@commander199x",
  },
];
