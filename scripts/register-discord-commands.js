#!/usr/bin/env node
/*
 * Registers all Commander slash commands with Discord.
 * Run once after installing, and again whenever you add a command or a link.
 *   node scripts/register-discord-commands.js
 * Reads DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN from .env.local (never commit that file).
 * Social commands are registered only for links filled in lib/discord-socials.ts.
 */
const fs = require('fs');
const path = require('path');

function readEnv() {
  const env = {};
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function readSocials() {
  const file = path.join(process.cwd(), 'lib/discord-socials.ts');
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/"?(youtube|tiktok|kick|twitch)"?\s*:\s*"([^"]*)"/g)) out[m[1]] = m[2].trim();
  return out;
}

const LABEL = { youtube: 'YouTube', tiktok: 'TikTok', kick: 'Kick', twitch: 'Twitch' };

(async () => {
  const env = { ...readEnv(), ...process.env };
  const appId = env.DISCORD_APPLICATION_ID;
  const token = env.DISCORD_BOT_TOKEN;
  if (!appId || !token) {
    console.error('Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN in .env.local');
    process.exit(1);
  }

  const commands = [
    {
      name: 'ladder',
      type: 1,
      description: "Show a player's Commander rating and rank, or the top 5",
      options: [
        { type: 3, name: 'player', description: 'Player name on commander.host (leave empty for the top 5)', required: false },
        {
          type: 3, name: 'mode', description: 'Which ladder (default: Team)', required: false,
          choices: [{ name: 'Team', value: 'team' }, { name: 'FFA', value: 'ffa' }],
        },
      ],
    },
    { name: 'help', type: 1, description: 'List all Commander bot commands' },
  ];
  const socials = readSocials();
  for (const key of Object.keys(LABEL)) {
    if (socials[key]) commands.push({ name: key, type: 1, description: `Get the Commander ${LABEL[key]} link` });
  }

  let failed = false;
  for (const cmd of commands) {
    const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
    if (res.ok) console.log(`\x1b[32m✔\x1b[0m /${cmd.name}`);
    else {
      failed = true;
      const text = await res.text();
      console.error(`\x1b[31m✘\x1b[0m /${cmd.name}: Discord said ${res.status}: ${text}`);
      if (res.status === 401) console.error('  -> The bot token is wrong. Reset it on the Bot page and update .env.local.');
      if (res.status === 404) console.error('  -> The Application ID is wrong. Copy it from General Information.');
      if (res.status === 429) console.error('  -> Too many requests. Wait a minute and run this again.');
    }
  }
  if (!failed) console.log('\nAll commands registered. In Discord press Ctrl+R; new ones can take a few minutes to appear.');
  process.exit(failed ? 1 : 0);
})();
