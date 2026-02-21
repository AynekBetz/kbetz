import { calculateEV } from "./ev.js";
import { generateSmartProbability } from "./aiModelV2.js";

function toDecimal(odds) {
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

          const decimal = toDecimal(outcome.price);
          const implied = 1 / decimal;

          const smartProb = generateSmartProbability(
            implied,
            event.bookmakers
          );

          const evData = calculateEV(smartProb, decimal, stake);

          if (evData.expectedValue > 0) {
            results.push({
              sport: event.sport_title,
              matchup: `${event.home_team} vs ${event.away_team}`,
              outcome: outcome.name,
              bookmaker: book.title,
              odds: outcome.price,
              ev: evData.expectedValue,
              edge: smartProb - implied
            });
          }
        }
      }
    }
  }

  return results.sort((a, b) => b.ev - a.ev);
}