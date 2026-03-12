export function calculateConfidenceScore(bet) {

  let score = 0;

  // EV strength
  if (bet.ev > 5) score += 4;
  else if (bet.ev > 3) score += 3;
  else if (bet.ev > 1) score += 2;

  // Edge strength
  if (bet.edge > 0.05) score += 3;
  else if (bet.edge > 0.03) score += 2;
  else if (bet.edge > 0.01) score += 1;

  // Odds value
  if (bet.odds > 100) score += 1;

  // Cap score
  return Math.min(score, 10);
}
