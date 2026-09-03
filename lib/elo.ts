// Basic ELO rating system.
// Simplifications:
// - Team matches: uses each team's AVERAGE rating to compute one delta,
//   applied equally to every player on that team.
// - FFA matches: winner is compared 1-on-1 against each other participant;
//   each loser's delta comes only from their matchup vs the winner (not
//   vs other losers).

const K = 32;
export const DEFAULT_RATING = 1000;

export function expectedScore(ratingSelf: number, ratingOpponent: number): number {
  return 1 / (1 + Math.pow(10, (ratingOpponent - ratingSelf) / 400));
}

export function eloDelta(ratingSelf: number, ratingOpponent: number, actualScore: 0 | 1): number {
  const expected = expectedScore(ratingSelf, ratingOpponent);
  return Math.round(K * (actualScore - expected));
}

function average(nums: number[]): number {
  if (nums.length === 0) return DEFAULT_RATING;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Compute rating deltas for a team match.
 * ratings: map of username -> current rating
 * winners/losers: username arrays
 * Returns a map of username -> delta (positive or negative)
 */
export function computeTeamMatchDeltas(
  ratings: Record<string, number>,
  winners: string[],
  losers: string[]
): Record<string, number> {
  const winnerAvg = average(winners.map((u) => ratings[u] ?? DEFAULT_RATING));
  const loserAvg = average(losers.map((u) => ratings[u] ?? DEFAULT_RATING));

  const winnerDelta = eloDelta(winnerAvg, loserAvg, 1);
  const loserDelta = eloDelta(loserAvg, winnerAvg, 0);

  const deltas: Record<string, number> = {};
  for (const u of winners) deltas[u] = winnerDelta;
  for (const u of losers) deltas[u] = loserDelta;
  return deltas;
}

/**
 * Compute rating deltas for an FFA match (one winner vs N losers).
 */
export function computeFfaMatchDeltas(
  ratings: Record<string, number>,
  winner: string,
  losers: string[]
): Record<string, number> {
  const winnerRating = ratings[winner] ?? DEFAULT_RATING;
  const deltas: Record<string, number> = {};

  let totalWinnerDelta = 0;
  for (const loser of losers) {
    const loserRating = ratings[loser] ?? DEFAULT_RATING;
    const loserDelta = eloDelta(loserRating, winnerRating, 0);
    deltas[loser] = loserDelta;
    totalWinnerDelta += eloDelta(winnerRating, loserRating, 1);
  }

  deltas[winner] = losers.length > 0 ? Math.round(totalWinnerDelta / losers.length) : 0;
  return deltas;
}
