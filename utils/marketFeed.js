let feed = []

export function updateMarketFeed(events) {

  events.forEach(event => {

    if (!event.bookmakers) return

    event.bookmakers.forEach(book => {

      book.markets?.forEach(market => {

        market.outcomes?.forEach(outcome => {

          const entry = {

            game: `${event.home_team} vs ${event.away_team}`,
            side: outcome.name,
            price: outcome.price,
            book: book.title,
            time: new Date().toLocaleTimeString()

          }

          feed.unshift(entry)

          if (feed.length > 25) {
            feed.pop()
          }

        })

      })

    })

  })

}

export function getMarketFeed() {
  return feed
}