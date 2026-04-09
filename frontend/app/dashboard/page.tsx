"use client";

import { useEffect, useState } from "react";
import { fetchOdds } from "../../utils/oddsFetcher";

export default function Dashboard() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    async function loadOdds() {
      const data = await fetchOdds();
      setGames(data);
    }

    loadOdds();

    const interval = setInterval(loadOdds, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🔥 KBETZ LIVE TERMINAL</h1>

      {games.length === 0 && (
        <div>Loading real odds...</div>
      )}

      {games.map((g, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #00ffcc",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "10px"
          }}
        >
          <h3>{g.team}</h3>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{g.away}</span>
            <span>
              {g.bestAway.odds} ({g.bestAway.book})
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{g.home}</span>
            <span>
              {g.bestHome.odds} ({g.bestHome.book})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}