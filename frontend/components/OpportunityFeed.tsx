export default function OpportunityFeed({ data }: { data: any[] }) {

  const safeData = Array.isArray(data) ? data : []

  const opportunities = safeData
    .filter((d) => d.ev || d.steam || d.arb)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10)

  if (opportunities.length === 0) {
    return <p>No opportunities yet</p>
  }

  return (
    <div>
      {opportunities.map((row, i) => (
        <div key={i}>
          🔥 {row.game} ({row.book}) - {row.odds}
          <span style={{ marginLeft: "8px", color: "#00ff88" }}>
            SCORE {row.score}
          </span>
        </div>
      ))}
    </div>
  )
}