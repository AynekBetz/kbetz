"use client"

export default function MarketMonitor({ data }: { data?: any[] }) {

  const rows = Array.isArray(data) ? data : []

  const signals = rows.filter(
    (row: any) =>
      row.steam ||
      Math.abs(row.movement || 0) >= 5
  )

  if (signals.length === 0) {

    return (
      <div className="text-gray-400 text-sm">
        Waiting for market signals...
      </div>
    )

  }

  return (

    <div className="space-y-2">

      {signals.slice(0, 10).map((row: any, i: number) => (

        <div
          key={i}
          className="flex justify-between border-b border-gray-700 pb-1 text-sm"
        >

          <div>

            {row.steam && <span className="neon-red">🔥 Steam</span>}

            {Math.abs(row.movement) >= 10 &&
              <span className="neon-green"> 📈 Big Move</span>
            }

            {" "}
            {row.game}

          </div>

          <div className="text-gray-400">

            {row.market} {row.odds}

          </div>

        </div>

      ))}

    </div>

  )

}