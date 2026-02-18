import { calculateEV } from "./ev.js";
import { generateModelProbability } from "./aiModel.js";

function americanToDecimal(odds) {
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
}

export function scanForPositiveEV(events, stake = 100) {
  const results = [];

  for (const event of events) {
    if (!event.bookmakers) continue;

    for (const book of event.bookmakers) {
      for (const market of book.markets || []) {
        for (const outcome of market.outcomes || []) {

          const decimalOdds = americanToDecimal(outcome.price);
          const impliedProb = 1 / decimalOdds;

          const modelProb = generateModelProbability(impliedProb);

          const evData = calculateEV(modelProb, decimalOdds, stake);

          if (evData.expectedValue > 0) {
            results.push({
              sport: event.sport_title,
              matchup: `${event.home_team} vs ${event.away_team}`,
              bookmaker: book.title,
              outcome: outcome.name,
              odds: outcome.price,
              ev: evData.expectedValue,
              edge: modelProb - impliedProb
            });
          }
        }
      }
    }
  }

  return results.sort((a, b) => b.ev - a.ev);
}
