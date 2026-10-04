// Settings for the Discord bot. Links for's /youtube, /tiktok, /kick and /twitch commands.
// Leave a link as "" to switch that command off.
// After editing: git push (so the site updates), then run: node scripts/register-discord-commands.js
export const SOCIALS = {
  youtube: "https://www.youtube.com/@CommanderZH",
  tiktok: "https://www.tiktok.com/@commander199x",
  kick: "https://kick.com/commander-xx",
  twitch: "https://www.twitch.tv/commander_199x",
};

// The channel /support and /مساعدة point to. In Discord: User Settings → Advanced → Developer Mode ON,
// then right-click the channel → Copy Channel ID. Leave "" to switch those commands off.
export const SUPPORT_CHANNEL_ID = "1484583468603150418";
