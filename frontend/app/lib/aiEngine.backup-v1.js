export function predictGame(game, movement, implied) {
  let score = 50;

  // Market movement
  if (movement === "up") score += 15;
  else if (movement === "down") score -= 8;

  // Implied probability
  if (implied >= 0.60) score += 20;
  else if (implied >= 0.55) score += 15;
  else if (implied >= 0.50) score += 10;

  // Sportsbook consensus
  const books = game.books?.length || 0;

  if (books >= 8) score += 10;
  else if (books >= 5) score += 5;

  const confidence = Math.min(99, Math.max(55, score));

  const expectedValue = Number(
    ((confidence - 50) / 10).toFixed(2)
  );

  const winProbability = Math.min(99, confidence);

  const recommendation =
    confidence >= 70
      ? game.home
      : game.away;

  const aiRating =
    confidence >= 90 ? "A+" :
    confidence >= 85 ? "A" :
    confidence >= 80 ? "A-" :
    confidence >= 75 ? "B+" :
    confidence >= 70 ? "B" :
    confidence >= 65 ? "B-" :
    "C";

  const riskLevel =
    confidence >= 90
      ? "Low"
      : confidence >= 80
      ? "Medium"
      : "High";

  const betSize =
    confidence >= 90
      ? "2 Units"
      : confidence >= 85
      ? "1.5 Units"
      : confidence >= 75
      ? "1 Unit"
      : "0.5 Unit";

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
