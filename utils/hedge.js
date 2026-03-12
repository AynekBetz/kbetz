export default function hedgeCalculator({ betAmount, odds1, odds2 }) {

  const decimal1 = odds1 > 0 ? (odds1 / 100) + 1 : (100 / Math.abs(odds1)) + 1;
  const decimal2 = odds2 > 0 ? (odds2 / 100) + 1 : (100 / Math.abs(odds2)) + 1;

  const payout = betAmount * decimal1;

  const hedgeAmount = payout / decimal2;

  const guaranteedProfit = payout - hedgeAmount - betAmount;

  return {
    hedgeAmount,
    guaranteedProfit
  };

}