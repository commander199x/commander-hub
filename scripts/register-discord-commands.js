#!/usr/bin/env node
/*
 * Registers the Commander slash command with Discord (run once, and again whenever you change it).
 *   node scripts/register-discord-commands.js            -> registers /ladder
 *   node scripts/register-discord-commands.js zhrank     -> registers /zhrank instead
 * Reads DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN from .env.local (never commit that file).
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

(async () => {
  const env = { ...readEnv(), ...process.env };
  const appId = env.DISCORD_APPLICATION_ID;
  const token = env.DISCORD_BOT_TOKEN;
  const name = (process.argv[2] || 'ladder').toLowerCase();

  if (!appId || !token) {
    console.error('Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN in .env.local');
    process.exit(1);
  }
  if (!/^[-_a-z0-9]{1,32}$/.test(name)) {
    console.error('Command names must be 1-32 lowercase letters, numbers, - or _');
    process.exit(1);
  }

  const command = {
    name,
    type: 1,
    description: "Show a player's Commander rating and rank, or the top 5",
    options: [
      { type: 3, name: 'player', description: 'Player name on commander.host (leave empty for the top 5)', required: false },
      {
        type: 3, name: 'mode', description: 'Which ladder (default: Team)', required: false,
        choices: [{ name: 'Team', value: 'team' }, { name: 'FFA', value: 'ffa' }],
      },
    ],
  };

  const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Discord said ${res.status}: ${text}`);
    if (res.status === 401) console.error('-> The bot token is wrong. Reset it on the Bot page and update .env.local.');
    if (res.status === 404) console.error('-> The Application ID is wrong. Copy it from General Information.');
    process.exit(1);
  }
  console.log(`\x1b[32m✔\x1b[0m /${name} registered. In Discord press Ctrl+R; it should appear within a few minutes.`);
})();
