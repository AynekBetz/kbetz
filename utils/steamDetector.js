let previousLines = {};

export function detectSteamMoves(events) {

  const steamMoves = [];

  for (const event of events) {

    if (!event.bookmakers) continue;

    const eventKey = `${event.home_team}_${event.away_team}`;

    for (const book of event.bookmakers) {

      for (const market of book.markets || []) {

        if (market.key !== "h2h" && market.key !== "spreads") continue;

        for (const outcome of market.outcomes || []) {

          const lineKey = `${eventKey}_${outcome.name}_${book.title}`;

          const currentPrice = outcome.price;

          if (!previousLines[lineKey]) {
            previousLines[lineKey] = currentPrice;
            continue;
          }

          const previousPrice = previousLines[lineKey];

          const difference = Math.abs(currentPrice - previousPrice);

          if (difference >= 20) {

            steamMoves.push({
              game: `${event.home_team} vs ${event.away_team}`,
              side: outcome.name,
              sportsbook: book.title,
              previous: previousPrice,
              current: currentPrice,
              movement: `${previousPrice} → ${currentPrice}`,
              type: "STEAM MOVE"
            });

          }

          previousLines[lineKey] = currentPrice;

        }

      }

    }

  }

  return steamMoves;

}