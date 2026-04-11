"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [aiPick, setAiPick] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data`);
        const data = await res.json();

        setGames(data.games || []);
        setAiPick(data.aiPick || null);
      } catch (err) {
        console.log("Fetch error:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        🔥 KBETZ (STABLE)
      </h1>

      {/* AI PICK */}
      {aiPick && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            background: "#4c1d95",
            borderRadius: "10px",
          }}
        >
          <h2>🧠 AI PICK</h2>
          <div>{aiPick.matchup}</div>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>
            {aiPick.odds}
          </div>
          <div>EV: {aiPick.ev}%</div>
          <div>Confidence: {aiPick.confidence}</div>
        </div>
      )}

      {/* GAMES */}
      {games.map((g) => (
        <div
          key={g.id}
          style={{
            padding: "15px",
            background: "#111",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              {g.away} @ {g.home}
            </span>
            <span>{g.odds}</span>
          </div>
          <div style={{ fontSize: "12px", color: "#aaa" }}>
            EV: {g.ev}%
          </div>
        </div>
      ))}
    </div>
  );
}