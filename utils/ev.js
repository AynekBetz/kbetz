export function calculateEV(decimalOdds, trueProbability) {
  const impliedProbability = 1 / decimalOdds;

  const ev =
    trueProbability * (decimalOdds - 1) -
    (1 - trueProbability);

  return {
    impliedProbability,
    ev,
    positive: ev > 0
  };
}
