export function calculateHedge({
  stake1,
  odds1,
  odds2
}) {
  // Convert American odds to decimal
  function toDecimal(odds) {
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  }

  const dec1 = toDecimal(odds1);
  const dec2 = toDecimal(odds2);

  const payout1 = stake1 * dec1;

  const hedgeStake = payout1 / dec2;

  const profitIf1Wins = payout1 - stake1 - hedgeStake;
  const profitIf2Wins = (hedgeStake * dec2) - hedgeStake - stake1;

  return {
    hedgeStake: Number(hedgeStake.toFixed(2)),
    profitIf1Wins: Number(profitIf1Wins.toFixed(2)),
    profitIf2Wins: Number(profitIf2Wins.toFixed(2))
  };
}
