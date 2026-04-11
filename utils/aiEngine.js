export function generateAIPick(games) {
  if (!games || games.length === 0) return null;

  const valid = games.filter((g) => g.ev !== null);
  if (valid.length === 0) return null;

  const sorted = valid.sort((a, b) => b.ev - a.ev);
  const best = sorted[0];

  let confidence = "LOW";
  if (best.ev > 5) confidence = "HIGH";
  else if (best.ev > 2) confidence = "MEDIUM";

  return {
    matchup: `${best.away} @ ${best.home}`,
    odds: best.best_line?.price,
    ev: best.ev,
    confidence,
    reason: "Top EV play on the board"
  };
}