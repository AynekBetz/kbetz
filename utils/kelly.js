// utils/kelly.js

export function calculateKelly(probability, odds, bankroll = null) {
  if (!probability || !odds) {
    throw new Error("Probability and odds are required");
  }

  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1");
  }

  let decimalOdds;

  // Convert American odds if needed
  if (odds > 0 && odds >= 100) {
    decimalOdds = 1 + (odds / 100);
  } else if (odds < 0) {
    decimalOdds = 1 + (100 / Math.abs(odds));
  } else {
    decimalOdds = odds; // already decimal
  }

  const b = decimalOdds - 1;
  const q = 1 - probability;

  const kellyFraction = ((b * probability) - q) / b;

  const safeKelly = kellyFraction < 0 ? 0 : kellyFraction;

  if (bankroll) {
    return {
      kellyFraction: safeKelly,
      recommendedStake: safeKelly * bankroll
    };
  }

  return {
    kellyFraction: safeKelly
  };
}
