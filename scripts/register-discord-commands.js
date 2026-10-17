#!/usr/bin/env node
/*
 * Registers ALL Commander slash commands with Discord in one go (replaces the old list,
 * so removed commands disappear). Run after installing, and whenever you change a link.
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
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/"?(youtube|tiktok|kick|twitch)"?\s*:\s*"([^"]*)"/g)) out[m[1]] = m[2].trim();
  const sup = text.match(/SUPPORT_CHANNEL_ID\s*=\s*"(\d*)"/);
  out.support = sup ? sup[1] : '';
  return out;
}

const LABEL = { youtube: 'YouTube', tiktok: 'TikTok', kick: 'Kick', twitch: 'Twitch' };
const player = (name, en, ar, required = true) => ({ type: 3, name, description: en, description_localizations: { ar }, required, autocomplete: true });
const cmd = (name, en, ar, options) => ({ name, type: 1, description: en, description_localizations: { ar }, ...(options ? { options } : {}) });

(async () => {
  const env = { ...readEnv(), ...process.env };
  const appId = env.DISCORD_APPLICATION_ID;
  const token = env.DISCORD_BOT_TOKEN;
  if (!appId || !token) {
    console.error('Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN in .env.local');
    process.exit(1);
  }

  const commands = [
    cmd('ladder', 'Top 10 on the ranked ladder (or one player)', 'أفضل 10 في التصنيف (أو لاعب واحد)', [
      player('player', 'A player (leave empty for the top 10)', 'لاعب (اتركه فارغاً لأفضل 10)', false),
      { type: 3, name: 'mode', description: 'Which ladder (default: Team)', description_localizations: { ar: 'أي تصنيف (الافتراضي: الفرق)' }, required: false, choices: [{ name: 'Team', value: 'team', name_localizations: { ar: 'الفرق' } }, { name: 'FFA', value: 'ffa' }] },
    ]),
    cmd('player', "A player's full commander file", 'ملف قائد كامل للاعب', [player('name', 'Player name — start typing', 'اسم اللاعب — ابدأ بالكتابة')]),
    cmd('h2h', 'Head-to-head between two players', 'مواجهة مباشرة بين لاعبَين', [player('player1', 'First player', 'اللاعب الأول'), player('player2', 'Second player', 'اللاعب الثاني')]),
    cmd('achievements', "A player's achievements", 'إنجازات لاعب', [player('name', 'Player name — start typing', 'اسم اللاعب — ابدأ بالكتابة')]),
    cmd('meta', 'The best generals right now', 'أفضل الجنرالات الآن'),
    cmd('recent', 'The latest ranked results', 'آخر النتائج المصنّفة'),
    cmd('play', "Who's ready to play right now", 'من جاهز للعب الآن'),
    cmd('events', 'Upcoming clan nights, tournaments and streams', 'ليالي الكلان والبطولات والبث القادمة'),
    cmd('live', 'Are we live? Plus the stream queue', 'هل نحن مباشر؟ مع طابور البث'),
    cmd('queue', 'The stream lobby and who is next', 'لوبي البث ومن التالي'),
    cmd('help', 'Everything the Commander bot can do', 'كل ما يستطيع بوت كوماندر فعله'),
    cmd('whoareu', 'Meet the Commander bot', 'تعرّف على بوت كوماندر'),
  ];
  const socials = readSocials();
  for (const key of Object.keys(LABEL)) if (socials[key]) commands.push(cmd(key, `Get the Commander ${LABEL[key]} link`, `رابط كوماندر على ${LABEL[key]}`));
  if (socials.support) {
    commands.push(cmd('support', 'Where to get help on the Commander server', 'أين تجد المساعدة في سيرفر كوماندر'));
    commands.push({ name: 'مساعدة', type: 1, description: 'Where to get help (أين تجد المساعدة)' });
  }

  // one request replaces the whole list
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      method: 'PUT',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (res.ok) {
      const list = await res.json();
      for (const c of list) console.log(`\x1b[32m✔\x1b[0m /${c.name}`);
      console.log(`\n${list.length} commands registered. In Discord press Ctrl+R; changes can take a minute to appear.`);
      process.exit(0);
    }
    const text = await res.text();
    if (res.status === 429 && attempt < 4) {
      let wait = 2;
      try { wait = Number(JSON.parse(text).retry_after) || 2; } catch {}
      console.log(`  … Discord asked us to slow down, waiting ${Math.ceil(wait)}s`);
      await new Promise((r) => setTimeout(r, Math.ceil(wait * 1000) + 300));
      continue;
    }
    console.error(`\x1b[31m✘\x1b[0m Discord said ${res.status}: ${text}`);
    if (res.status === 401) console.error('  -> The bot token is wrong. Reset it on the Bot page and update .env.local.');
    if (res.status === 404) console.error('  -> The Application ID is wrong. Copy it from General Information.');
    process.exit(1);
  }
})();
