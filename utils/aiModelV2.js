export function calculateConsensusProbability(bookmakers) {
  let total = 0;
  let count = 0;

  for (const book of bookmakers || []) {
    for (const market of book.markets || []) {
      for (const outcome of market.outcomes || []) {

        const odds = outcome.price;
        let decimal;

        if (odds > 0) decimal = 1 + odds / 100;
        else decimal = 1 + 100 / Math.abs(odds);

        total += 1 / decimal;
        count++;
      }
    }
  }

  return count === 0 ? 0 : total / count;
}

export function generateSmartProbability(impliedProb, bookmakers) {
  const consensus = calculateConsensusProbability(bookmakers);

  const marketWeight = 0.6;
  const modelWeight = 0.4;

  const variance = (Math.random() * 0.04) - 0.02;

  let smart =
    consensus * marketWeight +
    (impliedProb + variance) * modelWeight;

  if (smart < 0.01) smart = 0.01;
  if (smart > 0.99) smart = 0.99;

  return smart;
}