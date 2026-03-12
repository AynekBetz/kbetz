export function findBestLines(events) {

  const results = []

  for (const event of events) {

    if (!event.bookmakers) continue

    const lines = {}

    for (const book of event.bookmakers) {

      for (const market of book.markets || []) {

        for (const outcome of market.outcomes || []) {

          const key = outcome.name

          if (!lines[key]) lines[key] = []

          lines[key].push({
            book: book.title,
            price: outcome.price
          })

        }

      }

    }

    Object.keys(lines).forEach(side => {

      const best = lines[side].reduce((a,b)=>
        a.price > b.price ? a : b
      )

      results.push({

        game:`${event.home_team} vs ${event.away_team}`,
        side,
        bestBook:best.book,
        bestPrice:best.price,
        allBooks:lines[side]

      })

    })

  }

  return results

}