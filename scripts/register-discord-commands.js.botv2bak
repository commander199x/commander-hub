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
  const sup = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').match(/SUPPORT_CHANNEL_ID\s*=\s*"(\d*)"/) : null;
  out.support = sup ? sup[1] : '';
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    { name: 'whoareu', type: 1, description: 'Meet the Commander bot' },
  ];
  const socials = readSocials();
  for (const key of Object.keys(LABEL)) {
    if (socials[key]) commands.push({ name: key, type: 1, description: `Get the Commander ${LABEL[key]} link` });
  }
  if (socials.support) {
    commands.push({ name: 'support', type: 1, description: 'Where to get help on the Commander server' });
    commands.push({ name: 'مساعدة', type: 1, description: 'Where to get help (أين تجد المساعدة)' });
  }

  let failed = false;
  for (const cmd of commands) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd),
      });
      if (res.ok) { console.log(`\x1b[32m✔\x1b[0m /${cmd.name}`); break; }
      const text = await res.text();
      if (res.status === 429 && attempt < 4) {
        let wait = 2;
        try { wait = Number(JSON.parse(text).retry_after) || 2; } catch {}
        console.log(`  … Discord asked us to slow down, waiting ${Math.ceil(wait)}s`);
        await sleep(Math.ceil(wait * 1000) + 300);
        continue;
      }
      failed = true;
      console.error(`\x1b[31m✘\x1b[0m /${cmd.name}: Discord said ${res.status}: ${text}`);
      if (res.status === 401) console.error('  -> The bot token is wrong. Reset it on the Bot page and update .env.local.');
      if (res.status === 404) console.error('  -> The Application ID is wrong. Copy it from General Information.');
      break;
    }
    await sleep(400); // be gentle with Discord's rate limit
  }
  if (!failed) console.log('\nAll commands registered. In Discord press Ctrl+R; new ones can take a few minutes to appear.');
  process.exit(failed ? 1 : 0);
})();
