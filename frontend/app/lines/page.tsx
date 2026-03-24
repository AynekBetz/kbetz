"use client";

import { useEffect, useState } from "react";

export default function LinesPage() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:10000/odds")
      .then((res) => res.json())
      .then((data) => setGames(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📈 Live Lines</h1>

      {games.map((g) => (
        <div key={g.id} style={{
          border: "1px solid #222",
          marginBottom: "10px"
        }}>
          <div style={{ padding: "6px", color: "#aaa" }}>
            {g.away_team} @ {g.home_team}
          </div>

          {g.markets[0].outcomes.map((o: any) => (
            <div key={o.name} style={{ padding: "6px" }}>
              {o.name}: {o.price}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}