export function calculateKelly({ odds, winProbability, bankroll }) {

  function toDecimal(odds) {
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  }

  const decimalOdds = toDecimal(odds);

  const b = decimalOdds - 1;
  const p = winProbability;
  const q = 1 - p;

  const kellyFraction = (b * p - q) / b;

  const recommendedStake = bankroll * kellyFraction;

  return {
    kellyFraction: Number(kellyFraction.toFixed(4)),
    recommendedStake: Number(Math.max(0, recommendedStake).toFixed(2))
  };
}
