export function calculateEV(probability, odds, stake = 100) {
  if (!probability || !odds) {
    throw new Error("Probability and odds are required");
  }

  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1");
  }

  let decimalOdds;

  if (odds > 0 && odds >= 100) {
    decimalOdds = 1 + odds / 100;
  } else if (odds < 0) {
    decimalOdds = 1 + 100 / Math.abs(odds);
  } else {
    decimalOdds = odds;
  }

  const winAmount = stake * (decimalOdds - 1);
  const lossAmount = stake;

  const expectedValue =
    probability * winAmount -
    (1 - probability) * lossAmount;

  const evPercent = (expectedValue / stake) * 100;

  return {
    expectedValue,
    evPercent
  };
}
