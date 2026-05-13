"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const [games, setGames] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/data`);
        const data = await res.json();

        if (!data || !Array.isArray(data.games)) {
          console.warn("Bad API response", data);
          return;
        }

        setGames(data.games);

        const picks = data.games
          .map((g) => ({
            game: `${g.away} @ ${g.home}`,
            edge: g.edgeScore || 0,
            odds: g.homeOdds || "-110",
            winProb: Math.min(95, Math.max(50, 50 + (g.edgeScore || 0) * 5)),
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

  // 🔥 STRIPE CONNECT
  const handleUpgrade = async () => {
    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Stripe not configured");
      }
    } catch (err) {
      alert("Upgrade failed");
    }
  };

  // 🔥 SIMPLE HEDGE ENGINE
  const hedge =
    parlay.length >= 2
      ? "Hedge last leg to lock profit"
      : "Build parlay to unlock hedge";

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.logo}>KBETZ TERMINAL</h1>

        <div>
          <span style={styles.live}>● LIVE</span>
          <span style={styles.badge}>{isPro ? "PRO" : "FREE"}</span>

          {!isPro && (
            <button style={styles.upgrade} onClick={handleUpgrade}>
              Upgrade
            </button>
          )}

          <button style={styles.btn}>Logout</button>
        </div>
      </div>

      {/* AI PICKS */}
      <div style={styles.card}>
        <h2>🧠 AI PICKS</h2>

        <div style={!isPro ? styles.blur : {}}>
          {aiPicks.length === 0 ? (
            <p>No picks yet...</p>
          ) : (
            aiPicks.map((p, i) => (
              <div key={i} style={styles.row}>
                <span>{p.game}</span>

                <span style={{ color: "#00ffcc" }}>
                  EV: {p.edge} | {p.winProb}% WIN
                </span>

                <button
                  style={styles.smallBtn}
                  onClick={() => addToParlay(p)}
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>

        {!isPro && <div style={styles.lock}>🔒 PRO ONLY</div>}
      </div>

      {/* MARKETS */}
      <div style={styles.card}>
        <h2>Markets</h2>

        {games.length === 0 ? (
          <p>No live games...</p>
        ) : (
          games.map((g, i) => (
            <div key={i} style={styles.row}>
              <span>
                {g.away} @ {g.home}
              </span>

              <span style={{ color: "#00ffcc" }}>
                {g.homeOdds || "-110"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* PARLAY BUILDER */}
      <div style={styles.card}>
        <h2>🔥 AI PARLAY BUILDER</h2>

        {parlay.length === 0 ? (
          <p>No selections yet</p>
        ) : (
          parlay.map((p, i) => (
            <div key={i}>{p.game}</div>
          ))
        )}

        <div style={{ marginTop: "15px" }}>
          <strong>$100.00</strong>
          <br />
          Parlay: {parlay.length} legs
        </div>
      </div>

      {/* HEDGE */}
      <div style={styles.card}>
        <h2>🛡 Hedge Insight</h2>
        <p>{hedge}</p>
      </div>
    </div>
  );
}

/* ===================== */
/* 🔥 KBETZ SIGNATURE UI */
/* ===================== */

const styles = {
  page: {
    background:
      "radial-gradient(circle at 80% 0%, #003c3c, #000 40%, #1a0033 100%)",
    color: "white",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  logo: {
    fontSize: "28px",
    fontWeight: "bold",
    background: "linear-gradient(90deg,#7f00ff,#00ffff)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  card: {
    background: "rgba(10, 0, 25, 0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 0 20px rgba(128,0,255,0.25)",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },

  btn: {
    marginLeft: "10px",
    padding: "6px 12px",
    background: "#111",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "6px",
    cursor: "pointer",
  },

  smallBtn: {
    marginLeft: "10px",
    background: "linear-gradient(90deg,#00ffcc,#00ffaa)",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "6px",
    color: "#000",
    fontWeight: "bold",
  },

  live: {
    color: "#00ffcc",
    marginRight: "10px",
  },

  badge: {
    background: "#222",
    padding: "4px 8px",
    borderRadius: "6px",
    marginRight: "8px",
  },

  upgrade: {
    background: "#00ffcc",
    color: "#000",
    padding: "5px 10px",
    borderRadius: "6px",
    marginRight: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  blur: {
    filter: "blur(6px)",
    pointerEvents: "none",
  },

  lock: {
    marginTop: "10px",
    color: "#ff4d4d",
    fontWeight: "bold",
  },
};