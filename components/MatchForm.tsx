"use client";

import { useState, useEffect, useMemo } from "react";
import { RotateCcw, Search, UserPlus, X, Crown, Trophy, Calendar, Map as MapIcon, Upload, Link2, Swords, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/theme";
import { logMatch, type Mode } from "@/lib/logMatch";
import { useFeedback } from "@/components/FeedbackProvider";
import { maps as MAP_FILES } from "@/lib/maps-data";
import GeneralSelect from "@/components/GeneralSelect";
import type { GeneralKey } from "@/lib/generals";

type Profile = { username: string };

const T1 = C.amber;
const T2 = C.radar;
const INPUT = "min-h-[44px] w-full border border-[#8A6425] bg-[#0A0C08] px-3 text-sm text-[#EDEAE0] focus:border-[#E8A63D]";

export default function MatchForm({ allUsers }: { allUsers: Profile[] }) {
  const supabase = createClient();
  const fb = useFeedback();
  const [mode, setMode] = useState<Mode>("4v4");

  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [winningTeam, setWinningTeam] = useState<1 | 2 | null>(null);

  const [participants, setParticipants] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  const [generals, setGenerals] = useState<Record<string, GeneralKey | "">>({});
  const [notes, setNotes] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [round, setRound] = useState("");
  const [map, setMap] = useState("");
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [replayLink, setReplayLink] = useState("");
  const [replayFile, setReplayFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingLastMatch, setLoadingLastMatch] = useState(false);
  const [search, setSearch] = useState("");
  const [justLogged, setJustLogged] = useState(false);

  // Guest players: names typed in on the spot for people without a site
  // account. They're just plain text in participants/winners (the matches
  // table doesn't require a real profile), but they won't have an avatar,
  // a persistent rating, or a clickable profile link.
  const [guestPlayers, setGuestPlayers] = useState<string[]>([]);
  const [guestNameInput, setGuestNameInput] = useState("");

  // Every guest name ever used before, fetched so we can offer autocomplete
  // and catch near-duplicate typos (different case/spacing) before they
  // create a brand new "ghost" guest with a split history.
  const [knownGuestNames, setKnownGuestNames] = useState<string[]>([]);

  useEffect(() => {
    async function loadKnownGuests() {
      const { data } = await supabase.from("guest_ratings").select("name");
      setKnownGuestNames((data ?? []).map((g: { name: string }) => g.name));
    }
    loadKnownGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registeredNames = allUsers.map((u) => u.username);
  const allPlayerNames = [...registeredNames, ...guestPlayers];
  const mapNames = useMemo(() => MAP_FILES.map((m) => m.name), []);

  function normalize(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
  }

  async function addGuestPlayer() {
    const name = guestNameInput.trim();
    if (!name) return;

    if (allPlayerNames.some((n) => normalize(n) === normalize(name))) {
      setMessage(`"${name}" is already in the player list for this match.`);
      return;
    }

    // Check for a near-match against every registered user and every guest
    // ever used, to catch typos before they fragment someone's history.
    const allKnownNames = [...registeredNames, ...knownGuestNames];
    const exactExisting = allKnownNames.find((n) => normalize(n) === normalize(name));

    if (exactExisting && exactExisting !== name) {
      setGuestPlayers((prev) => [...prev, exactExisting]);
      setGuestNameInput("");
      setMessage(`Matched existing player "${exactExisting}" (adjusted spelling/case to match).`);
      return;
    }

    if (!exactExisting) {
      const similar = allKnownNames.find((n) => normalize(n).includes(normalize(name)) || normalize(name).includes(normalize(n)));
      if (similar) {
        const confirmUse = await fb.confirm({
          title: "Did you mean an existing player?",
          message: `A player named "${similar}" already exists. Did you mean them, instead of creating "${name}" as a new guest?`,
          confirmLabel: `Use "${similar}"`,
          cancelLabel: `Add "${name}" as new`,
        });
        if (confirmUse) {
          setGuestPlayers((prev) => [...prev, similar]);
          setGuestNameInput("");
          setMessage(null);
          return;
        }
      }
    }

    setGuestPlayers((prev) => [...prev, name]);
    setGuestNameInput("");
    setMessage(null);
  }

  function removeGuestPlayer(name: string) {
    setGuestPlayers((prev) => prev.filter((g) => g !== name));
    setTeam1((prev) => prev.filter((u) => u !== name));
    setTeam2((prev) => prev.filter((u) => u !== name));
    setParticipants((prev) => prev.filter((u) => u !== name));
    if (winner === name) setWinner(null);
  }

  const isTeamMode = mode === "2v2" || mode === "3v3" || mode === "4v4";
  const expectedTeamSize = mode === "2v2" ? 2 : mode === "3v3" ? 3 : 4;

  // Converts the selected date (YYYY-MM-DD) into a timestamp for created_at.
  // Uses noon on that date to avoid timezone day-shift issues.
  function getMatchTimestamp(): string {
    return new Date(`${matchDate}T12:00:00`).toISOString();
  }

  function resetAll() {
    setTeam1([]);
    setTeam2([]);
    setWinningTeam(null);
    setParticipants([]);
    setWinner(null);
    setGenerals({});
    setNotes("");
    setTournamentName("");
    setRound("");
    setMap("");
    setMatchDate(new Date().toISOString().slice(0, 10));
    setReplayLink("");
    setReplayFile(null);
  }

  // Pre-fills the roster of the most recent match in the current mode
  // (but never the winner — that always needs a human).
  async function repeatLastMatch() {
    setLoadingLastMatch(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("matches")
      .select("participants, winners, map")
      .eq("mode", mode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLoadingLastMatch(false);

    if (error || !data) {
      setMessage(`No previous ${mode.toUpperCase()} match found to repeat.`);
      return;
    }

    const registeredSet = new Set(registeredNames);
    const newGuests = data.participants.filter((p: string) => !registeredSet.has(p) && !guestPlayers.includes(p));
    if (newGuests.length > 0) setGuestPlayers((prev) => [...prev, ...newGuests]);

    if (isTeamMode) {
      const prevWinners: string[] = data.winners;
      const prevLosers: string[] = data.participants.filter((p: string) => !prevWinners.includes(p));
      setTeam1(prevWinners);
      setTeam2(prevLosers);
      setWinningTeam(null);
    } else {
      setParticipants(data.participants);
      setWinner(null);
    }

    if (data.map) setMap(data.map);
    setMessage(`Loaded roster from the last ${mode.toUpperCase()} match — pick the winner and submit.`);
  }

  // An uploaded file takes priority over a pasted link if both are provided.
  async function resolveReplayUrl(): Promise<string | null> {
    if (replayFile) {
      const ext = replayFile.name.split(".").pop() || "rep";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("replays").upload(path, replayFile);
      if (uploadError) {
        setMessage(`Replay upload failed: ${uploadError.message}`);
        return null;
      }
      const { data } = supabase.storage.from("replays").getPublicUrl(path);
      return data.publicUrl;
    }
    if (replayLink.trim()) return replayLink.trim();
    return null;
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetAll();
  }

  function assignToTeam(username: string, team: 1 | 2) {
    const alreadyOnThisTeam = team === 1 ? team1.includes(username) : team2.includes(username);
    if (alreadyOnThisTeam) {
      if (team === 1) setTeam1((prev) => prev.filter((u) => u !== username));
      else setTeam2((prev) => prev.filter((u) => u !== username));
      return;
    }
    const targetTeam = team === 1 ? team1 : team2;
    if (targetTeam.length >= expectedTeamSize) {
      setMessage(`Team ${team} already has ${expectedTeamSize} players for ${mode}.`);
      return;
    }
    setMessage(null);
    setTeam1((prev) => prev.filter((u) => u !== username));
    setTeam2((prev) => prev.filter((u) => u !== username));
    if (team === 1) setTeam1((prev) => [...prev, username]);
    else setTeam2((prev) => [...prev, username]);
  }

  function toggleFfaParticipant(username: string) {
    setParticipants((prev) => (prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]));
    if (winner === username) setWinner(null);
  }

  function chosenGenerals(players: string[]) {
    const out: Record<string, string> = {};
    for (const p of players) if (generals[p]) out[p] = generals[p] as string;
    return out;
  }

  async function handleSubmit() {
    setMessage(null);
    let allParticipants: string[];
    let winners: string[];

    if (isTeamMode) {
      if (team1.length === 0 || team2.length === 0) return setMessage("Both teams need at least one player.");
      if (winningTeam === null) return setMessage("Select which team won.");
      allParticipants = [...team1, ...team2];
      winners = winningTeam === 1 ? team1 : team2;
    } else {
      if (participants.length === 0) return setMessage("Select at least one participant.");
      if (!winner) return setMessage("Select the winner.");
      allParticipants = participants;
      winners = [winner];
    }

    setSubmitting(true);
    const replayUrl = await resolveReplayUrl();
    if (replayFile && !replayUrl) {
      setSubmitting(false);
      return;
    }
    const { error } = await logMatch(supabase, {
      mode,
      participants: allParticipants,
      winners,
      notes,
      tournamentName,
      round,
      map,
      createdAt: getMatchTimestamp(),
      replayUrl,
      generals: chosenGenerals(allParticipants),
    });
    setSubmitting(false);

    if (error) fb.error(`Couldn't log the match: ${error}`);
    else {
      fb.success("Match logged.");
      setMessage(null);
      resetAll();
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2000);
    }
  }

  const q = search.trim().toLowerCase();
  const visible = allPlayerNames.filter((n) => !q || n.toLowerCase().includes(q));
  const picked = new Set(isTeamMode ? [...team1, ...team2] : participants);

  const teamBox = (team: 1 | 2, list: string[]) => {
    const color = team === 1 ? T1 : T2;
    const won = winningTeam === team;
    return (
      <div className="flex flex-col border transition-[border-color,box-shadow] duration-300" style={{ borderColor: won ? color : C.line, boxShadow: won ? `0 0 24px ${color}33` : "none", background: won ? `linear-gradient(160deg, ${color}14, #0A0C08 60%)` : C.void }}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.line }}>
          <span className="cz-display text-xl uppercase" style={{ color, fontWeight: 700 }}>Team {team}</span>
          <span className="text-xs tabular-nums" style={{ color: list.length === expectedTeamSize ? C.radar : C.muted }}>{list.length}/{expectedTeamSize}</span>
        </div>
        <ul className="flex flex-1 flex-col gap-2 p-3">
          {list.map((u) => (
            <li key={u} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm" style={{ fontWeight: 600, color: guestPlayers.includes(u) ? C.amber : C.paper }}>{u}</span>
              <GeneralSelect compact value={generals[u] ?? ""} onChange={(v) => setGenerals((g) => ({ ...g, [u]: v }))} label={`General for ${u}`} />
              <button type="button" onClick={() => assignToTeam(u, team)} aria-label={`Remove ${u}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: C.muted }}><X size={15} aria-hidden="true" /></button>
            </li>
          ))}
          {list.length === 0 && <li className="py-4 text-center text-sm" style={{ color: C.muted }}>Click players below to add them</li>}
        </ul>
        <button type="button" onClick={() => setWinningTeam(team)} aria-pressed={won} className="m-3 mt-0 inline-flex min-h-[44px] items-center justify-center gap-2 border text-xs uppercase tracking-widest transition-colors" style={{ background: won ? color : "transparent", color: won ? C.void : color, borderColor: color, fontWeight: 700 }}>
          {won ? <Trophy size={15} aria-hidden="true" /> : <Crown size={15} aria-hidden="true" />}
          {won ? `Team ${team} won` : `Team ${team} won?`}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* mode + repeat */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border" style={{ borderColor: C.amberDim }} role="group" aria-label="Mode">
          {(["2v2", "3v3", "4v4", "ffa"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)} className="min-h-[44px] px-4 text-sm uppercase tracking-widest transition-colors" style={{ background: mode === m ? C.amber : "transparent", color: mode === m ? C.void : C.paper, fontWeight: mode === m ? 700 : 500 }}>
              {m}
            </button>
          ))}
        </div>
        <button type="button" onClick={repeatLastMatch} disabled={loadingLastMatch} title={`Pre-fill the same roster as the last ${mode.toUpperCase()} match`} className="inline-flex min-h-[44px] items-center gap-2 border px-4 text-xs uppercase tracking-widest transition-colors hover:bg-[#171B10] disabled:opacity-50" style={{ borderColor: C.lineStrong, color: C.paper }}>
          {loadingLastMatch ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={15} aria-hidden="true" />}
          Repeat last {mode.toUpperCase()}
        </button>
      </div>

      {/* teams / ffa */}
      {isTeamMode ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          {teamBox(1, team1)}
          <div className="flex items-center justify-center"><Swords size={26} style={{ color: C.lineStrong }} aria-hidden="true" /></div>
          {teamBox(2, team2)}
        </div>
      ) : (
        <div className="border" style={{ borderColor: C.line, background: C.void }}>
          <div className="border-b px-4 py-3 text-xs uppercase tracking-widest" style={{ borderColor: C.line, color: C.muted }}>Participants · tap the crown for the winner</div>
          <ul className="flex flex-col gap-2 p-3">
            {participants.map((u) => (
              <li key={u} className="flex items-center gap-2">
                <button type="button" onClick={() => setWinner(u)} aria-pressed={winner === u} aria-label={`${u} won`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center border transition-colors" style={{ background: winner === u ? C.amber : "transparent", borderColor: winner === u ? C.amber : C.lineStrong, color: winner === u ? C.void : C.muted }}>
                  <Crown size={15} aria-hidden="true" />
                </button>
                <span className="min-w-0 flex-1 truncate text-sm" style={{ fontWeight: winner === u ? 700 : 500, color: winner === u ? C.amber : C.paper }}>{u}</span>
                <GeneralSelect compact value={generals[u] ?? ""} onChange={(v) => setGenerals((g) => ({ ...g, [u]: v }))} label={`General for ${u}`} />
                <button type="button" onClick={() => toggleFfaParticipant(u)} aria-label={`Remove ${u}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: C.muted }}><X size={15} aria-hidden="true" /></button>
              </li>
            ))}
            {participants.length === 0 && <li className="py-4 text-center text-sm" style={{ color: C.muted }}>Click players below to add them</li>}
          </ul>
        </div>
      )}

      {/* player picker */}
      <div className="border" style={{ borderColor: C.line }}>
        <div className="flex flex-wrap gap-3 border-b p-3" style={{ borderColor: C.line }}>
          <label className="relative flex-[1_1_200px]">
            <span className="sr-only">Search players</span>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 12, color: C.muted }} />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players" className={`${INPUT} ps-9`} />
          </label>
          <div className="flex flex-[1_1_240px] gap-2">
            <input
              type="text"
              list="known-guest-names"
              placeholder="Add a guest (no account)"
              value={guestNameInput}
              onChange={(e) => setGuestNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGuestPlayer();
                }
              }}
              className={INPUT}
            />
            <datalist id="known-guest-names">{knownGuestNames.map((name) => <option key={name} value={name} />)}</datalist>
            <button type="button" onClick={addGuestPlayer} aria-label="Add guest" className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 border px-3 text-xs uppercase tracking-widest" style={{ borderColor: C.amberDim, color: C.amber }}>
              <UserPlus size={15} aria-hidden="true" /> Add
            </button>
          </div>
        </div>
        <div className="flex max-h-[260px] flex-wrap gap-2 overflow-y-auto p-3">
          {visible.map((u) => {
            const guest = guestPlayers.includes(u);
            const on1 = team1.includes(u), on2 = team2.includes(u), onF = participants.includes(u);
            return (
              <span key={u} className="inline-flex items-center border text-sm" style={{ borderColor: on1 ? T1 : on2 ? T2 : onF ? C.amber : C.lineStrong, background: picked.has(u) ? "rgba(232,166,61,0.06)" : "transparent" }}>
                <span className="px-2.5 py-1.5" style={{ color: guest ? C.amber : C.paper }}>{u}{guest && <span className="ms-1 text-[10px] uppercase" style={{ color: C.muted }}>guest</span>}</span>
                {isTeamMode ? (
                  <>
                    <button type="button" onClick={() => assignToTeam(u, 1)} aria-pressed={on1} className="min-h-[34px] border-s px-2 text-[11px] font-bold" style={{ borderColor: C.lineStrong, background: on1 ? T1 : "transparent", color: on1 ? C.void : T1 }}>T1</button>
                    <button type="button" onClick={() => assignToTeam(u, 2)} aria-pressed={on2} className="min-h-[34px] border-s px-2 text-[11px] font-bold" style={{ borderColor: C.lineStrong, background: on2 ? T2 : "transparent", color: on2 ? C.void : T2 }}>T2</button>
                  </>
                ) : (
                  <button type="button" onClick={() => toggleFfaParticipant(u)} aria-pressed={onF} className="min-h-[34px] border-s px-2 text-[11px] font-bold" style={{ borderColor: C.lineStrong, background: onF ? C.amber : "transparent", color: onF ? C.void : C.amber }}>{onF ? "IN" : "ADD"}</button>
                )}
                {guest && (
                  <button type="button" onClick={() => removeGuestPlayer(u)} aria-label={`Remove guest ${u}`} className="min-h-[34px] border-s px-2" style={{ borderColor: C.lineStrong, color: "#F87171" }}><X size={13} aria-hidden="true" /></button>
                )}
              </span>
            );
          })}
          {visible.length === 0 && <span className="text-sm" style={{ color: C.muted }}>No players match “{search}”.</span>}
        </div>
      </div>

      {/* details */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}><Calendar size={12} aria-hidden="true" />Match date</span>
          <input type="date" value={matchDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setMatchDate(e.target.value)} className={INPUT} />
        </label>
        <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}><MapIcon size={12} aria-hidden="true" />Map</span>
          <input type="text" list="match-form-maps" placeholder="e.g. Tournament Desert" value={map} onChange={(e) => setMap(e.target.value)} className={INPUT} />
          <datalist id="match-form-maps">{mapNames.map((m) => <option key={m} value={m} />)}</datalist>
        </label>
        <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Tournament (optional)</span>
          <input type="text" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} className={INPUT} />
        </label>
        <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Round (optional)</span>
          <input type="text" placeholder="e.g. Final" value={round} onChange={(e) => setRound(e.target.value)} className={INPUT} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}><Link2 size={12} aria-hidden="true" />Replay link</span>
          <input type="text" placeholder="Discord, Drive…" value={replayLink} disabled={!!replayFile} onChange={(e) => { setReplayLink(e.target.value); if (e.target.value) setReplayFile(null); }} className={`${INPUT} disabled:opacity-40`} />
        </label>
        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}><Upload size={12} aria-hidden="true" />…or upload the file</span>
          <input type="file" id="replay-file-input" accept=".rep,.zip" className="sr-only" onChange={(e) => { const file = e.target.files?.[0] ?? null; setReplayFile(file); if (file) setReplayLink(""); }} />
          <label htmlFor="replay-file-input" className="flex min-h-[44px] cursor-pointer items-center gap-3 border border-dashed px-3 text-sm" style={{ borderColor: replayFile ? C.amber : C.amberDim, background: C.void }}>
            <Upload size={15} style={{ color: C.amber }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate" style={{ color: replayFile ? C.paper : C.muted }}>{replayFile ? replayFile.name : "Choose a .rep or .zip"}</span>
            {replayFile && <button type="button" onClick={(e) => { e.preventDefault(); setReplayFile(null); }} aria-label="Remove file" style={{ color: C.muted }}><X size={15} aria-hidden="true" /></button>}
          </label>
        </div>
      </div>

      <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${INPUT} py-2`} />
      </label>

      {message && <p role="status" className="border px-4 py-3 text-sm" style={{ borderColor: C.amberDim, color: C.paper, background: "rgba(232,166,61,0.06)" }}>{message}</p>}

      <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex min-h-[54px] items-center justify-center gap-2 text-sm uppercase tracking-[0.14em] transition-[filter] hover:brightness-110 disabled:opacity-60" style={{ background: justLogged ? C.radar : C.amber, color: C.void, fontWeight: 700, boxShadow: "0 0 26px rgba(232,166,61,0.25)" }}>
        {submitting ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : justLogged ? <Check size={17} aria-hidden="true" /> : <Swords size={17} aria-hidden="true" />}
        {submitting ? "Saving…" : justLogged ? "Logged" : "Log match"}
      </button>
    </div>
  );
}
