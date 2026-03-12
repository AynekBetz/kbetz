const lineHistory = {};

export function trackLineMovement(events) {

  for (const event of events) {

    if (!event.bookmakers) continue;

    const eventKey = `${event.home_team}_${event.away_team}`;

    for (const book of event.bookmakers) {

      for (const market of book.markets || []) {

        if (market.key !== "h2h" && market.key !== "spreads") continue;

        for (const outcome of market.outcomes || []) {

          const lineKey = `${eventKey}_${outcome.name}`;

          if (!lineHistory[lineKey]) {
            lineHistory[lineKey] = [];
          }

          const history = lineHistory[lineKey];
          const currentLine = outcome.price;

          // Always store the first line
          if (history.length === 0) {

            history.push(currentLine);
            continue;

          }

          const lastLine = history[history.length - 1];

          if (currentLine !== lastLine) {

            history.push(currentLine);

            // keep history manageable
            if (history.length > 20) {
              history.shift();
            }

          }

        }

      }

    }

  }

}

export function getLineHistory() {

  return lineHistory;

}