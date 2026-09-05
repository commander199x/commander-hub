"""
Commander Hub Replay Watcher
=============================

Watches your Zero Hour Replays folder for new .rep files, does a best-effort
extraction of player names from the replay header, then asks YOU to confirm
the team split, mode, and winner before uploading the match to your website.

IMPORTANT — read this before relying on it:
The .rep binary format's exact byte layout isn't something this script has
been tested against real files for. The name extraction works by pulling out
readable text chunks from the file header, which usually works but can
occasionally pick up junk or miss a name (special characters, very short
names, etc). ALWAYS check the "Detected players" list the script shows you
before confirming — fix any wrong/missing names before it uploads.

Setup:
1. pip install requests watchdog
2. Fill in the CONFIG section below.
3. Run: python replay_watcher.py
4. Leave it running while you play. Each time a match ends, it'll prompt you
   in this terminal window.

This does NOT determine who won automatically — replay files don't store
that. You'll be asked every time.
"""

import os
import re
import time
import requests
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ── CONFIG ────────────────────────────────────────────────────────────────
REPLAYS_FOLDER = str(
    Path.home() / "Documents" / "Command and Conquer Generals Zero Hour Data" / "Replays"
)
WEBSITE_URL = "http://localhost:3000"  # or "http://localhost:3000" while testing
UPLOAD_SECRET = "8cd19e78b319b7820ea841fbeba4a822d2cd79962cf8421e488d1be95b876e87"  # must match .env.local on the server
# ─────────────────────────────────────────────────────────────────────────


def extract_candidate_names(filepath: str) -> list[str]:
    """
    Best-effort extraction: pulls printable ASCII strings out of the
    replay's header region and returns ones that look like plausible
    player names (letters/numbers/underscore, reasonable length).
    This is a heuristic, not a full binary parser — always verify the
    results before confirming the upload.
    """
    with open(filepath, "rb") as f:
        header_bytes = f.read(4096)  # header is near the start of the file

    # Find runs of printable ASCII characters of length >= 3
    strings_found = re.findall(rb"[ -~]{3,}", header_bytes)
    candidates = []
    for raw in strings_found:
        text = raw.decode("ascii", errors="ignore").strip()
        # Filter to things that look like usernames: no spaces, reasonable
        # length, not obviously a path/version string
        if (
            3 <= len(text) <= 20
            and re.match(r"^[A-Za-z0-9_]+$", text)
            and not text.lower().startswith(("gener", "zero", "hour", "cnc", "v1.", "http"))
        ):
            candidates.append(text)

    # De-duplicate while preserving order
    seen = set()
    unique = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return unique


def prompt_and_upload(filepath: str):
    print(f"\n{'=' * 60}")
    print(f"New replay detected: {os.path.basename(filepath)}")
    print(f"{'=' * 60}")

    candidates = extract_candidate_names(filepath)
    print(f"\nDetected possible player names: {candidates}")
    print("(This is a best-effort guess — fix anything wrong below.)\n")

    participants_input = input(
        f"Participants, comma-separated [{', '.join(candidates)}]: "
    ).strip()
    participants = (
        [p.strip() for p in participants_input.split(",")]
        if participants_input
        else candidates
    )

    if not participants:
        print("No participants entered — skipping this replay.")
        return

    print(f"\nParticipants: {participants}")

    mode = input("Mode (2v2 / 3v3 / 4v4 / ffa): ").strip().lower()
    if mode not in ("2v2", "3v3", "4v4", "ffa"):
        print("Invalid mode — skipping this replay.")
        return

    if mode == "ffa":
        winner = input(f"Who won? ({', '.join(participants)}): ").strip()
        winners = [winner]
    else:
        winners_input = input(
            f"Winning team members, comma-separated ({', '.join(participants)}): "
        ).strip()
        winners = [w.strip() for w in winners_input.split(",")]

    if not all(w in participants for w in winners):
        print("Winners must be a subset of participants — skipping this replay.")
        return

    confirm = input(f"\nUpload: {mode} | winners={winners} | all={participants}? (y/n): ").strip().lower()
    if confirm != "y":
        print("Skipped.")
        return

    response = requests.post(
        f"{WEBSITE_URL}/api/log-match",
        headers={"x-replay-secret": UPLOAD_SECRET, "Content-Type": "application/json"},
        json={
            "mode": mode,
            "participants": participants,
            "winners": winners,
            "notes": f"Auto-detected from replay: {os.path.basename(filepath)}",
        },
    )

    if response.status_code == 200:
        print("✓ Match uploaded successfully.")
    else:
        print(f"✗ Upload failed ({response.status_code}): {response.text}")


class ReplayHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.lower().endswith(".rep"):
            # Small delay to make sure the game finished writing the file
            time.sleep(1.5)
            try:
                prompt_and_upload(event.src_path)
            except Exception as e:
                print(f"Error processing {event.src_path}: {e}")


def main():
    if not os.path.isdir(REPLAYS_FOLDER):
        print(f"Replays folder not found at: {REPLAYS_FOLDER}")
        print("Edit REPLAYS_FOLDER in this script to point at the correct path.")
        return

    print(f"Watching for new replays in: {REPLAYS_FOLDER}")
    print("Leave this window open while you play. Press Ctrl+C to stop.\n")

    event_handler = ReplayHandler()
    observer = Observer()
    observer.schedule(event_handler, REPLAYS_FOLDER, recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
