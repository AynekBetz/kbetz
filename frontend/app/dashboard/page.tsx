"use client";

import { useEffect, useState } from "react";
import { getOdds, createCheckout } from "../../lib/api";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    loadOdds();
  }, []);

  const loadOdds = async () => {
    const data = await getOdds();
    setGames(data);
  };

  return (
    <div style={{
      background: "#020202",
      color: "white",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <h1>🔥 KBETZ LIVE TERMINAL</h1>

      {/* 🔥 UPGRADE BUTTON (DO NOT BREAK) */}
      <button
        onClick={createCheckout}
        style={{
          background: "#00ffcc",
          color: "black",
          padding: "10px",
          borderRadius: "5px",
          marginBottom: "20px"
        }}
      >
        Upgrade to PRO
      </button>

      {/* 🔥 GAMES */}
      {games.map((g, i) => (
        <div key={i} style={{
          border: "1px solid #00ffcc",
          padding: "10px",
          marginBottom: "10px"
        }}>
          <h3>{g.team}</h3>

          <div>
            {g.away}: {g.bestAway?.odds} ({g.bestAway?.book})
          </div>

          <div>
            {g.home}: {g.bestHome?.odds} ({g.bestHome?.book})
          </div>
        </div>
      ))}
    </div>
  );
}