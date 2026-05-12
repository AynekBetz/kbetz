"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const [games, setGames] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [parlay, setParlay] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/data`);
        const data = await res.json();

        // 🛑 CRASH PROTECTION (VERY IMPORTANT)
        if (!data || !Array.isArray(data.games)) {
          console.warn("Invalid API response", data);
          return;
        }

        setGames(data.games);

        const picks = data.games
          .map((g) => ({
            game: `${g.away} @ ${g.home}`,
            edge: g.edgeScore || 0,
            odds: g.homeOdds || "-110",
          }))
          .sort((a, b) => b.edge - a.edge)
          .slice(0, 3);

        setAiPicks(picks);
      } catch (err) {
        console.error("Fetch crash:", err);
      }
    };

    fetchData();
  }, []);

  const addToParlay = (pick) => {
    setParlay((prev) => [...prev, pick]);
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.logo}>KBETZ TERMINAL</h1>
        <div>
          <span style={{ color: "#00ffcc" }}>● LIVE</span>
          <button style={styles.btn}>Logout</button>
        </div>
      </div>

      {/* AI PICKS */}
      <div style={styles.card}>
        <h2>🧠 AI PICKS</h2>
        {aiPicks.map((p, i) => (
          <div key={i} style={styles.pick}>
            <span>{p.game}</span>
            <span style={{ color: "#00ffcc" }}>EV: {p.edge}</span>
            <button onClick={() => addToParlay(p)} style={styles.smallBtn}>
              Add
            </button>
          </div>
        ))}
      </div>

      {/* MARKETS */}
      <div style={styles.card}>
        <h2>Markets</h2>
        {games.map((g, i) => (
          <div key={i} style={styles.market}>
            <span>{g.away} @ {g.home}</span>
            <span style={{ color: "#00ffcc" }}>
              {g.homeOdds || "-110"}
            </span>
          </div>
        ))}
      </div>

      {/* PARLAY BUILDER */}
      <div style={styles.card}>
        <h2>🔥 AI PARLAY BUILDER</h2>
        {parlay.map((p, i) => (
          <div key={i}>{p.game}</div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(180deg,#000,#2a0a5e)",
    color: "white",
    minHeight: "100vh",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  logo: {
    background: "linear-gradient(90deg,#7f00ff,#00ffff)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  card: {
    background: "rgba(20,0,40,0.9)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  pick: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  market: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  btn: {
    marginLeft: "10px",
    padding: "5px 10px",
  },
  smallBtn: {
    marginLeft: "10px",
    background: "#00ffcc",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
  },
};