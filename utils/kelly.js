export default function kellyCalculator({ odds, probability, bankroll }) {

  let b;

  if (odds > 0) {
    b = odds / 100;
  } else {
    b = 100 / Math.abs(odds);
  }

  const q = 1 - probability;

  const fraction = ((b * probability) - q) / b;

  const stake = bankroll * fraction;

  return {
    stake: Math.max(0, stake),
    fraction
  };

}