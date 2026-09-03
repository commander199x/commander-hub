"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { username: string };
type Mode = "3v3" | "4v4" | "ffa";

export default function MatchForm({ allUsers }: { allUsers: Profile[] }) {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("4v4");

  // Team-mode state (3v3 / 4v4)
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [winningTeam, setWinningTeam] = useState<1 | 2 | null>(null);

  // FFA state
  const [participants, setParticipants] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isTeamMode = mode === "3v3" || mode === "4v4";
  const expectedTeamSize = mode === "3v3" ? 3 : 4;

  function resetAll() {
    setTeam1([]);
    setTeam2([]);
    setWinningTeam(null);
    setParticipants([]);
    setWinner(null);
    setNotes("");
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetAll();
  }

  // Assign a player to a team (or remove them). Clicking a team a player
  // is already on removes them; clicking the other team moves them.
function assignToTeam(username: string, team: 1 | 2) {
  const alreadyOnThisTeam = team === 1 ? team1.includes(username) : team2.includes(username);

  // Toggling off is always allowed
  if (alreadyOnThisTeam) {
    if (team === 1) setTeam1((prev) => prev.filter((u) => u !== username));
    else setTeam2((prev) => prev.filter((u) => u !== username));
    return;
  }

  // Block assigning if the target team is already full
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

      setSubmitting(true);
      const { error } = await supabase.from("matches").insert({
        mode,
        participants: allParticipants,
        winners,
        notes: notes || null,
      });
      setSubmitting(false);

      if (error) setMessage(`Error: ${error.message}`);
      else {
        setMessage("Match logged.");
        resetAll();
      }
      return;
    }

    // FFA
    if (participants.length === 0) {
      setMessage("Select at least one participant.");
      return;
    }
    if (!winner) {
      setMessage("Select the winner.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("matches").insert({
      mode,
      participants,
      winners: [winner],
      notes: notes || null,
    });
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

      {isTeamMode ? (
        <>
          <p style={{ opacity: 0.7, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Click a username to assign them to a team ({expectedTeamSize} per team recommended).
            Click again on the same team to remove them.
          </p>

          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {/* All players pool */}
            <div>
              <p style={{ fontWeight: 700 }}>All players</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {allUsers.map((u) => {
                  const onTeam1 = team1.includes(u.username);
                  const onTeam2 = team2.includes(u.username);
                  return (
                    <div key={u.username} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ minWidth: "110px", fontSize: "0.85rem" }}>{u.username}</span>
                      <button
                        type="button"
                        onClick={() => assignToTeam(u.username, 1)}
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
                        onClick={() => assignToTeam(u.username, 2)}
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

            {/* Team 1 summary */}
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

            {/* Team 2 summary */}
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
              {allUsers.map((u) => (
                <label key={u.username} style={{ fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={participants.includes(u.username)}
                    onChange={() => toggleFfaParticipant(u.username)}
                  />{" "}
                  {u.username}
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
