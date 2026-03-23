"use client"

export default function MarketTerminal({ data }: { data: any[] }) {

  const safeData = Array.isArray(data) ? data : []

  if (safeData.length === 0) {
    return <p>No terminal data yet</p>
  }

  const books = ["DraftKings", "FanDuel", "BetMGM", "Caesars"]

  const games = [...new Set(safeData.map((d) => d.game + "|" + d.market))]

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>

        {/* HEADER */}
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
            <th style={{ padding: "8px" }}>Game</th>
            {books.map((book) => (
              <th key={book} style={{ padding: "8px" }}>{book}</th>
            ))}
            <th>Edge</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {games.map((gameKey, i) => {
            const [game, market] = gameKey.split("|")

            return (
              <tr key={i} style={{ borderBottom: "1px solid #222" }}>

                {/* GAME COLUMN */}
                <td style={{ padding: "10px" }}>
                  {game} | {market}
                </td>

                {/* BOOK COLUMNS */}
                {books.map((book) => {
                  const row = safeData.find(
                    (d) => d.game === game && d.market === market && d.book === book
                  )

                  if (!row) {
                    return <td key={book}>-</td>
                  }

                  return (
                    <td key={book}>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          textAlign: "center",

                          // 🔥 AI COLOR SYSTEM
                          background:
                            row.score > 80
                              ? "rgba(0,255,136,0.25)"
                              : row.score > 65
                              ? "rgba(255,165,0,0.25)"
                              : "rgba(255,255,255,0.05)",
                        }}
                      >
                        {/* ODDS */}
                        <div style={{ fontWeight: "bold" }}>
                          {row.odds}
                        </div>

                        {/* TAGS */}
                        <div style={{ fontSize: "11px", marginTop: "4px" }}>
                          {row.score > 75 && <div style={{ color: "#00ff88" }}>BEST</div>}
                          {row.steam && <div style={{ color: "#ff4d6d" }}>STEAM</div>}
                          {row.arb && <div style={{ color: "#ffaa00" }}>ARB</div>}
                        </div>

                        {/* SCORE */}
                        <div style={{ fontSize: "10px", color: "#00ff88" }}>
                          SCORE {row.score || 0}
                        </div>
                      </div>
                    </td>
                  )
                })}

                {/* EDGE COLUMN */}
                <td style={{ textAlign: "center" }}>
                  🪙 ARB
                </td>

              </tr>
            )
          })}
        </tbody>

      </table>
    </div>
  )
}