"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeTeamMatchDeltas, computeFfaMatchDeltas, DEFAULT_RATING } from "@/lib/elo";

type Profile = { username: string };
type Mode = "3v3" | "4v4" | "ffa";

export default function MatchForm({ allUsers }: { allUsers: Profile[] }) {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("4v4");

  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [winningTeam, setWinningTeam] = useState<1 | 2 | null>(null);

  const [participants, setParticipants] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [round, setRound] = useState("");
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Guest players: names typed in on the spot for people without a site
  // account. They're just plain text in participants/winners (the matches
  // table doesn't require a real profile), but they won't have an avatar,
  // a persistent rating, or a clickable profile link.
  const [guestPlayers, setGuestPlayers] = useState<string[]>([]);
  const [guestNameInput, setGuestNameInput] = useState("");

  const registeredNames = allUsers.map((u) => u.username);
  const allPlayerNames = [...registeredNames, ...guestPlayers];

  function addGuestPlayer() {
    const name = guestNameInput.trim();
    if (!name) return;
    if (allPlayerNames.includes(name)) {
      setMessage(`"${name}" is already in the player list.`);
      return;
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

  const isTeamMode = mode === "3v3" || mode === "4v4";
  const expectedTeamSize = mode === "3v3" ? 3 : 4;

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
    setNotes("");
    setTournamentName("");
    setRound("");
    setMatchDate(new Date().toISOString().slice(0, 10));
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
    setParticipants((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
    if (winner === username) setWinner(null);
  }

  async function fetchRatings(usernames: string[]): Promise<Record<string, number>> {
    const { data } = await supabase
      .from("profiles")
      .select("username, rating")
      .in("username", usernames);

    const ratings: Record<string, number> = {};
    for (const row of data ?? []) {
      ratings[row.username] = row.rating ?? DEFAULT_RATING;
    }
    return ratings;
  }

  async function applyRatingChanges(
    deltas: Record<string, number>,
    currentRatings: Record<string, number>
  ) {
    for (const username of Object.keys(deltas)) {
      const newRating = (currentRatings[username] ?? DEFAULT_RATING) + deltas[username];
      await supabase.from("profiles").update({ rating: newRating }).eq("username", username);
    }
  }

  async function handleSubmit() {
    setMessage(null);

    if (isTeamMode) {
      if (team1.length === 0 || team2.length === 0) {
        setMessage("Both teams need at least one player.");
        return;
      }
      if (winningTeam === null) {
        setMessage("Select which team won.");
        return;
      }

      const allParticipants = [...team1, ...team2];
      const winners = winningTeam === 1 ? team1 : team2;
      const losers = winningTeam === 1 ? team2 : team1;

      setSubmitting(true);
      const currentRatings = await fetchRatings(allParticipants);
      const deltas = computeTeamMatchDeltas(currentRatings, winners, losers);

      const { error } = await supabase.from("matches").insert({
        mode,
        participants: allParticipants,
        winners,
        notes: notes || null,
        tournament_name: tournamentName || null,
        round: round || null,
        rating_changes: deltas,
        created_at: getMatchTimestamp(),
      });

      if (!error) await applyRatingChanges(deltas, currentRatings);
      setSubmitting(false);

      if (error) setMessage(`Error: ${error.message}`);
      else {
        setMessage("Match logged.");
        resetAll();
      }
      return;
    }

    if (participants.length === 0) {
      setMessage("Select at least one participant.");
      return;
    }
    if (!winner) {
      setMessage("Select the winner.");
      return;
    }

    const losers = participants.filter((p) => p !== winner);

    setSubmitting(true);
    const currentRatings = await fetchRatings(participants);
    const deltas = computeFfaMatchDeltas(currentRatings, winner, losers);

    const { error } = await supabase.from("matches").insert({
      mode,
      participants,
      winners: [winner],
      notes: notes || null,
      tournament_name: tournamentName || null,
      round: round || null,
      rating_changes: deltas,
      created_at: getMatchTimestamp(),
    });

    if (!error) await applyRatingChanges(deltas, currentRatings);
    setSubmitting(false);

    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage("Match logged.");
      resetAll();
    }
  }

  return (
    <div style={{ border: "1px solid #333", padding: "1rem", marginBottom: "1rem" }}>
      <h3>Log a Match</h3>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "0.5rem" }}>Mode: </label>
        <select
          value={mode}
          onChange={(e) => switchMode(e.target.value as Mode)}
          style={{
            background: "#131313",
            color: "#f5a623",
            border: "1px solid #333",
            padding: "0.3rem 0.6rem",
            fontFamily: "inherit",
          }}
        >
          <option value="3v3">3v3</option>
          <option value="4v4">4v4</option>
          <option value="ffa">FFA</option>
        </select>
      </div>

      <div style={{ marginBottom: "1rem", padding: "0.6rem", border: "1px dashed #444", borderRadius: "4px" }}>
        <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.4rem" }}>
          Add a guest player (no site account) for this match only:
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Guest name"
            value={guestNameInput}
            onChange={(e) => setGuestNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addGuestPlayer();
              }
            }}
            style={{
              background: "#131313",
              border: "1px solid #333",
              color: "#eee",
              padding: "0.35rem 0.6rem",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            onClick={addGuestPlayer}
            style={{
              background: "none",
              border: "1px solid #f5a623",
              color: "#f5a623",
              padding: "0.35rem 0.7rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Add guest
          </button>
        </div>
        {guestPlayers.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {guestPlayers.map((g) => (
              <span
                key={g}
                style={{
                  fontSize: "0.75rem",
                  background: "#1a1a1a",
                  border: "1px solid #444",
                  borderRadius: "3px",
                  padding: "0.15rem 0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {g} (guest)
                <button
                  type="button"
                  onClick={() => removeGuestPlayer(g)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {isTeamMode ? (
        <>
          <p style={{ opacity: 0.7, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Click a username to assign them to a team ({expectedTeamSize} per team recommended).
            Click again on the same team to remove them.
          </p>

          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontWeight: 700 }}>All players</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {allPlayerNames.map((username) => {
                  const isGuest = guestPlayers.includes(username);
                  const onTeam1 = team1.includes(username);
                  const onTeam2 = team2.includes(username);
                  return (
                    <div key={username} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ minWidth: "110px", fontSize: "0.85rem", color: isGuest ? "#f5a623" : "inherit" }}>
                        {username}
                        {isGuest && <span style={{ fontSize: "0.65rem", opacity: 0.6 }}> (guest)</span>}
                      </span>
                      <button
                        type="button"
                        onClick={() => assignToTeam(username, 1)}
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.15rem 0.4rem",
                          background: onTeam1 ? "#3b82f6" : "transparent",
                          color: onTeam1 ? "#fff" : "inherit",
                          border: "1px solid #3b82f6",
                        }}
                      >
                        T1
                      </button>
                      <button
                        type="button"
                        onClick={() => assignToTeam(username, 2)}
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.15rem 0.4rem",
                          background: onTeam2 ? "#ef4444" : "transparent",
                          color: onTeam2 ? "#fff" : "inherit",
                          border: "1px solid #ef4444",
                        }}
                      >
                        T2
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p style={{ fontWeight: 700, color: "#3b82f6" }}>Team 1 ({team1.length})</p>
              <ul style={{ fontSize: "0.85rem", paddingLeft: "1rem" }}>
                {team1.map((u) => (
                  <li key={u}>{u}</li>
                ))}
                {team1.length === 0 && <li style={{ opacity: 0.5 }}>No players yet</li>}
              </ul>
              <label style={{ fontSize: "0.85rem" }}>
                <input
                  type="radio"
                  name="winningTeam"
                  checked={winningTeam === 1}
                  onChange={() => setWinningTeam(1)}
                />{" "}
                Team 1 wins
              </label>
            </div>

            <div>
              <p style={{ fontWeight: 700, color: "#ef4444" }}>Team 2 ({team2.length})</p>
              <ul style={{ fontSize: "0.85rem", paddingLeft: "1rem" }}>
                {team2.map((u) => (
                  <li key={u}>{u}</li>
                ))}
                {team2.length === 0 && <li style={{ opacity: 0.5 }}>No players yet</li>}
              </ul>
              <label style={{ fontSize: "0.85rem" }}>
                <input
                  type="radio"
                  name="winningTeam"
                  checked={winningTeam === 2}
                  onChange={() => setWinningTeam(2)}
                />{" "}
                Team 2 wins
              </label>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: "0.75rem" }}>
            <p>Participants:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {allPlayerNames.map((username) => (
                <label key={username} style={{ fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={participants.includes(username)}
                    onChange={() => toggleFfaParticipant(username)}
                  />{" "}
                  {username}
                  {guestPlayers.includes(username) && (
                    <span style={{ fontSize: "0.65rem", opacity: 0.6, color: "#f5a623" }}> (guest)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <p>Winner (select one):</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {participants.map((username) => (
                <label key={username} style={{ fontSize: "0.85rem" }}>
                  <input
                    type="radio"
                    name="winner"
                    checked={winner === username}
                    onChange={() => setWinner(username)}
                  />{" "}
                  {username}
                </label>
              ))}
              {participants.length === 0 && <p style={{ opacity: 0.6 }}>Select participants first.</p>}
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 auto" }}>
          <label style={{ display: "block", fontSize: "0.75rem", opacity: 0.7, marginBottom: "0.2rem" }}>
            Match date
          </label>
          <input
            type="date"
            value={matchDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setMatchDate(e.target.value)}
            style={{
              background: "#131313",
              border: "1px solid #333",
              color: "#eee",
              padding: "0.4rem 0.6rem",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Tournament name (optional)"
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
          style={{
            flex: "1 1 200px",
            background: "#131313",
            border: "1px solid #333",
            color: "#eee",
            padding: "0.4rem 0.6rem",
            fontFamily: "inherit",
          }}
        />
        <input
          type="text"
          placeholder="Round (e.g. Semifinal) (optional)"
          value={round}
          onChange={(e) => setRound(e.target.value)}
          style={{
            flex: "1 1 200px",
            background: "#131313",
            border: "1px solid #333",
            color: "#eee",
            padding: "0.4rem 0.6rem",
            fontFamily: "inherit",
          }}
        />
      </div>

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", marginBottom: "0.75rem" }}
      />

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          background: submitting ? "#555" : "#f5a623",
          color: "#000",
          fontWeight: 700,
          padding: "0.6rem 1.4rem",
          border: "none",
          borderRadius: "4px",
          cursor: submitting ? "default" : "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.85rem",
        }}
      >
        {submitting ? "Saving..." : "Log Match"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}