export function findArbitrage(events) {

  const opportunities = []

  for (const event of events) {

    if (!event.bookmakers) continue

    const prices = []

    for (const book of event.bookmakers) {

      for (const market of book.markets || []) {

        for (const outcome of market.outcomes || []) {

          prices.push({
            name: outcome.name,
            price: outcome.price,
            book: book.title
          })

        }

      }

    }

    if (prices.length < 2) continue

    const bestPrices = {}

    for (const p of prices) {

      if (!bestPrices[p.name] || p.price > bestPrices[p.name].price) {
        bestPrices[p.name] = p
      }

    }

    const implied = Object.values(bestPrices).map((p) => {

      if (p.price > 0) return 100 / (p.price + 100)

      return Math.abs(p.price) / (Math.abs(p.price) + 100)

    })

    const total = implied.reduce((a, b) => a + b, 0)

    if (total < 1) {

      opportunities.push({

        matchup: `${event.home_team} vs ${event.away_team}`,
        profitMargin: (1 - total) * 100,
        books: Object.values(bestPrices)

      })

    }

  }

  return opportunities

}