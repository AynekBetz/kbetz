export function generateDailyCard(bets) {

  if (!bets || bets.length === 0) {
    return { bets: [] };
  }

  const sorted = [...bets].sort((a, b) => b.ev - a.ev);

  const topBets = sorted.slice(0, 3);

  return {
    bets: topBets
  };

}
