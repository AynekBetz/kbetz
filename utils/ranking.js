export function rankBets(bets) {
  return bets.map(bet => {
    let score = 0;

    score += bet.ev * 2;
    score += bet.edge * 100;

    if (bet.bookmaker === "DraftKings") score += 2;
    if (bet.bookmaker === "FanDuel") score += 2;

    return { ...bet, score };
  }).sort((a, b) => b.score - a.score);
}
