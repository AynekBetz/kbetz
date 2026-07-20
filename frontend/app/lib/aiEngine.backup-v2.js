export function predictGame(game, movement, implied) {
  let score = 50;

  // Market probability
  if (implied >= 0.65) score += 22;
  else if (implied >= 0.60) score += 18;
  else if (implied >= 0.55) score += 12;
  else if (implied >= 0.50) score += 6;

  // Line movement
  if (movement === "up") score += 12;
  else if (movement === "down") score -= 8;

  // Sportsbook consensus
  const books = game.books?.length || 0;
  if (books >= 10) score += 10;
  else if (books >= 8) score += 8;
  else if (books >= 5) score += 5;

  // Home favorite bonus
  if (game.homeOdds < game.awayOdds) {
    score += 5;
  }

  // Spread confidence
  if (typeof game.spread === "number") {
    if (Math.abs(game.spread) <= 3) score += 4;
    if (Math.abs(game.spread) >= 10) score -= 3;
  }

  const confidence = Math.max(55, Math.min(99, Math.round(score)));

  const expectedValue = Number(((confidence - 50) / 10).toFixed(2));

  const winProbability = confidence;

  const recommendation =
    game.homeOdds < game.awayOdds
      ? game.home
      : game.away;

  const aiRating =
    confidence >= 95 ? "A+" :
    confidence >= 90 ? "A" :
    confidence >= 85 ? "A-" :
    confidence >= 80 ? "B+" :
    confidence >= 75 ? "B" :
    confidence >= 70 ? "B-" :
    "C";

  const riskLevel =
    confidence >= 90 ? "Low" :
    confidence >= 80 ? "Medium" :
    "High";

  const betSize =
    confidence >= 92 ? "2 Units" :
    confidence >= 85 ? "1.5 Units" :
    confidence >= 75 ? "1 Unit" :
    "0.5 Unit";

  return {
    confidence,
    expectedValue,
    winProbability,
    recommendation,
    aiRating,
    riskLevel,
    betSize,
  };
}
