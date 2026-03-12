export function detectSharpLine(bookmakers) {
  const prices = [];

  for (const book of bookmakers || []) {
    for (const market of book.markets || []) {
      for (const outcome of market.outcomes || []) {
        prices.push(outcome.price);
      }
    }
  }

  const avg =
    prices.reduce((a, b) => a + b, 0) / prices.length;

  return prices.filter(price =>
    Math.abs(price - avg) > 15
  );
}