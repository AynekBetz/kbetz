export function getBestLines(bets) {

  const bestLines = {};

  for (const bet of bets) {

    const key = bet.matchup;

    if (!bestLines[key]) {
      bestLines[key] = bet;
      continue;
    }

    if (bet.odds > bestLines[key].odds) {
      bestLines[key] = bet;
    }

  }

  return Object.values(bestLines);

}
