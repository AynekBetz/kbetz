"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [aiPick, setAiPick] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data`);
        const data = await res.json();

        setGames(data.games || []);
        setAiPick(data.aiPick || null);
      } catch (err) {
        console.log("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <h1 style={{ fontSize: "28px", marginBottom: "25px" }}>
        🔥 KBETZ LIVE DASHBOARD
      </h1>

      {/* LOADING */}
      {loading && <div>Loading data...</div>}

      {/* AI PICK */}
      {aiPick && (
        <div
          style={{
            marginBottom: "25px",
            padding: "20px",
            background: "#4c1d95",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>🧠 AI PICK</h2>

          <div>{aiPick.matchup}</div>

          <div style={{ fontSize: "22px", fontWeight: "bold" }}>
            {aiPick.odds > 0 ? "+" : ""}
            {aiPick.odds}
          </div>

          <div>EV: {aiPick.ev}%</div>
          <div>Confidence: {aiPick.confidence}</div>
        </div>
      )}

      {/* GAMES LIST */}
      <div>
        {games.map((g) => (
          <div
            key={g.id}
            style={{
              padding: "15px",
              background: "#111",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #222",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                {g.away} @ {g.home}
              </span>

              <span style={{ fontWeight: "bold" }}>
                {g.odds > 0 ? "+" : ""}
                {g.odds}
              </span>
            </div>

            <div style={{ fontSize: "12px", color: "#aaa", marginTop: "5px" }}>
              EV: {g.ev}%
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}