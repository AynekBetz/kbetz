"use client"

export default function MarketHeatmap({ data }: { data?: any[] }) {

  // Always ensure data is an array
  const rows = Array.isArray(data) ? data : []

  if (rows.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No market data yet
      </div>
    )
  }

  const games = [...new Set(rows.map((row: any) => row.game))]

  return (

    <div className="space-y-3">

      {games.slice(0,10).map((game: string, i: number) => {

        const gameRows = rows.filter((r: any) => r.game === game)

        const movement = gameRows.reduce(
          (sum: number, r: any) => sum + (r.movement || 0),
          0
        )

        let color = "bg-gray-700"

        if (movement > 10) color = "bg-green-500/30"
        if (movement < -10) color = "bg-red-500/30"

        return (

          <div
            key={i}
            className={`p-3 rounded ${color} border border-gray-700`}
          >

            <div className="text-sm font-semibold">
              {game}
            </div>

            <div className="text-xs text-gray-400">
              Movement score: {movement}
            </div>

          </div>

        )

      })}

    </div>

  )

}