"use client";

import { useEffect, useState } from "react";
import { fetchOdds } from "../../utils/oddsFetcher";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOdds() {
      try {
        const data = await fetchOdds();
        setGames(data);
      } catch (err) {
        console.log("Frontend fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    // 🔥 INITIAL LOAD
    loadOdds();

    // 🔥 FIXED REFRESH (1 MINUTE — SAFE FOR API)
    const interval = setInterval(() => {
      loadOdds();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px", background: "#000", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ marginBottom: "20px" }}>🔥 KBETZ LIVE TERMINAL</h1>

      {loading && <div>Loading real odds...</div>}

      {!loading && games.length === 0 && (
        <div>No odds available</div>
      )}

      {games.map((g, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #00ffcc",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "10px",
            background: "#050505"
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>{g.team}</h3>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{g.away}</span>
            <span>
              {g.bestAway?.odds} ({g.bestAway?.book})
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{g.home}</span>
            <span>
              {g.bestHome?.odds} ({g.bestHome?.book})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}