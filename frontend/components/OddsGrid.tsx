"use client"

interface BookOdds {
  book: string
  odds: number
}

interface GameRow {
  game: string
  market: string
  books: BookOdds[]
}

export default function OddsGrid({ data }: { data: GameRow[] }) {

  const books = ["DraftKings", "FanDuel", "BetMGM", "Caesars"]

  function bestLine(books: BookOdds[]) {
    return Math.max(...books.map(b => b.odds))
  }

  function hasArb(books: BookOdds[]) {
    if (books.length < 2) return false

    const probs = books.map(b => 1 / Math.abs(b.odds))
    const total = probs.reduce((a, b) => a + b, 0)

    return total < 1
  }

  return (

    <div className="overflow-auto">

      <table className="w-full text-sm">

        <thead className="border-b border-white/10 text-muted">

          <tr>

            <th className="text-left px-4 py-3 w-72">
              Game
            </th>

            <th className="text-left px-4 py-3">
              Market
            </th>

            {books.map(book => (

              <th
                key={book}
                className="text-center px-4 py-3"
              >
                {book}
              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {data.map((row, i) => {

            const best = bestLine(row.books)
            const arb = hasArb(row.books)

            return (

              <tr
                key={i}
                className="border-b border-white/5 hover:bg-white/5 transition"
              >

                <td className="px-4 py-3 font-semibold">
                  {row.game}
                </td>

                <td className="px-4 py-3">
                  {row.market}
                </td>

                {books.map(book => {

                  const bookOdds = row.books.find(
                    b => b.book === book
                  )

                  const odds = bookOdds?.odds

                  let style = "bg-white/5"

                  if (odds === best) {
                    style = "bg-green-500/20 border border-green-400"
                  }

                  if (arb) {
                    style = "bg-blue-500/20 border border-blue-400"
                  }

                  return (

                    <td
                      key={book}
                      className="px-4 py-3 text-center"
                    >

                      {odds ? (

                        <div
                          className={`rounded px-3 py-1 inline-block ${style}`}
                        >
                          {odds}
                        </div>

                      ) : "-"}

                    </td>

                  )

                })}

              </tr>

            )

          })}

        </tbody>

      </table>

    </div>

  )

}