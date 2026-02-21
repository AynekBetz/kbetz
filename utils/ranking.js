export function rankBets(bets) {
  return bets.map(bet => {
    let score = 0;

    score += bet.ev * 2;
    score += bet.edge * 100;

    return { ...bet, score };
  }).sort((a, b) => b.score - a.score);
}