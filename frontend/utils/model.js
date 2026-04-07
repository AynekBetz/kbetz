// Convert American odds → implied probability
export function impliedProbability(odds) {
  if (odds > 0) return 100 / (odds + 100);
  return -odds / (-odds + 100);
}

// Estimate win probability (slight edge boost)
export function winProbability(odds, ev) {
  const base = impliedProbability(odds);
  const edgeBoost = Number(ev) / 100;

  const adjusted = base + edgeBoost;
  return Math.min(Math.max(adjusted, 0), 1); // clamp 0–1
}

// Confidence score
export function confidenceScore(prob) {
  if (prob > 0.62) return "High";
  if (prob > 0.55) return "Medium";
  return "Low";
}
