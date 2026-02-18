export function calculateHedge(stake1, odds1, odds2) {
  if (!stake1 || !odds1 || !odds2) {
    throw new Error("stake1, odds1, and odds2 are required");
  }

  const convert = (odds) => {
    if (odds > 0 && odds >= 100) return 1 + odds / 100;
    if (odds < 0) return 1 + 100 / Math.abs(odds);
    return odds;
  };

  const dec1 = convert(odds1);
  const dec2 = convert(odds2);

  const hedgeStake = (stake1 * dec1) / dec2;

  const profit1 = stake1 * dec1 - hedgeStake;
  const profit2 = hedgeStake * dec2 - stake1;

  return {
    hedgeStake,
    profitIfOriginalWins: profit1,
    profitIfHedgeWins: profit2,
    guaranteedProfit: Math.min(profit1, profit2)
  };
}
