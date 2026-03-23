"use client";

export default function TradingBoard({
  data,
  onSelect,
}: {
  data: any[];
  onSelect: (pick: any) => void;
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="glass-panel">No market data</div>;
  }

  const games = [...new Set(data.map((d) => d.game))];

  return (
    <div className="sportsbook">
      {games.map((game, i) => {
        const rows = data.filter((d) => d.game === game);

        return (
          <div key={i} className="game-card">
            <div className="game-header">{game}</div>

            <div className="market-row">
              {rows.map((row, j) => (
                <div
                  key={j}
                  className="odds-box"
                  onClick={() => onSelect(row)}
                >
                  <div className="market">{row.market}</div>
                  <div className="odds">{row.odds}</div>

                  {row.steam && <div className="tag steam">🔥</div>}
                  {row.ev > 2 && <div className="tag ev">+EV</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}