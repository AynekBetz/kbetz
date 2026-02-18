// utils/hedge.js

export function calculateHedge(stake1, odds1, odds2) {
  if (!stake1 || !odds1 || !odds2) {
    throw new Error("stake1, odds1, and odds2 are required");
  }

  // Convert to decimal if American
  const convertToDecimal = (odds) => {
    if (odds > 0 && odds >= 100) {
      return 1 + (odds / 100);
    } else if (odds < 0) {
      return 1 + (100 / Math.abs(odds));
    }
    return odds;
  };

  const dec1 = convertToDecimal(odds1);
  const dec2 = convertToDecimal(odds2);

  const hedgeStake = (stake1 * dec1) / dec2;

  const payoutIf1Wins = stake1 * dec1 - hedgeStake;
  const payoutIf2Wins = hedgeStake * dec2 - stake1;

  return {
    hedgeStake,
    payoutIf1Wins,
    payoutIf2Wins,
    guaranteedProfit: Math.min(payoutIf1Wins, payoutIf2Wins)
  };
}
