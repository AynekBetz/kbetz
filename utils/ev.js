export function calculateEV(probability, decimalOdds, stake = 100) {

  const payout = decimalOdds * stake;

  const expectedValue = (probability * payout) - stake;

  return {
    expectedValue,
    probability,
    decimalOdds,
    stake
  };

}