"use client"

export default function ActivityTicker({ data }: any) {

  // Ensure data is always an array
  const rows = Array.isArray(data) ? data : []

  const signals = rows
    .filter((d: any) => d.steam || d.sharp || d.ev)
    .slice(0, 10)

  if (signals.length === 0) {
    return (
      <div className="glass-panel text-sm text-gray-400">
        Waiting for market signals...
      </div>
    )
  }

  return (

    <div className="glass-panel overflow-hidden">

      <div className="animate-marquee whitespace-nowrap text-sm">

        {signals.map((row: any, i: number) => (

          <span key={i} className="mr-12">

            {row.steam && <span className="neon-red">🔥 Steam</span>}
            {row.ev && <span className="neon-green"> 💰 EV</span>}
            {row.sharp && <span className="neon-blue"> 🧠 Sharp</span>}

            {" "}
            {row.game}
            {" "}
            {row.market}
            {" "}
            {row.odds}

          </span>

        ))}

      </div>

    </div>

  )

}