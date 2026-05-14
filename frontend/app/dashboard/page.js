"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API = "https://kbetz-main.onrender.com"; // 🔥 FORCE CORRECT BACKEND

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

  // 🔥 FIXED STRIPE CONNECTION
  const handleUpgrade = async () => {
    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: localStorage.getItem("email") || "test@kbetz.com",
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Stripe failed");
      }
    } catch (err) {
      alert("Upgrade failed");
    }
  };

  const hedge =
    parlay.length >= 2
      ? "Hedge last leg to lock profit"
      : "Build parlay to unlock hedge";

  return (
    <div style={styles.page}>
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

      <div style={styles.card}>
        <h2>🧠 AI PICKS</h2>

        <div style={!isPro ? styles.blur : {}}>
          {aiPicks.map((p, i) => (
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
          ))}
        </div>

        {!isPro && <div style={styles.lock}>🔒 PRO ONLY</div>}
      </div>

      <div style={styles.card}>
        <h2>Markets</h2>

        {games.map((g, i) => (
          <div key={i} style={styles.row}>
            <span>{g.away} @ {g.home}</span>

            <span style={{ color: "#00ffcc" }}>
              {g.homeOdds || "-110"}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h2>🔥 AI PARLAY BUILDER</h2>

        {parlay.map((p, i) => (
          <div key={i}>{p.game}</div>
        ))}

        <div style={{ marginTop: "15px" }}>
          <strong>$100.00</strong>
          <br />
          Parlay: {parlay.length} legs
        </div>
      </div>

      <div style={styles.card}>
        <h2>🛡 Hedge Insight</h2>
        <p>{hedge}</p>
      </div>
    </div>
  );
}

/* SAME STYLES (UNCHANGED) */
const styles = {
  page: {
    background:
      "radial-gradient(circle at 80% 0%, #003c3c, #000 40%, #1a0033 100%)",
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
    fontSize: "28px",
    fontWeight: "bold",
    background: "linear-gradient(90deg,#7f00ff,#00ffff)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  card: {
    background: "rgba(10,0,25,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  btn: { marginLeft: "10px", padding: "6px 12px" },
  smallBtn: { marginLeft: "10px", background: "#00ffcc", padding: "5px" },
  live: { color: "#00ffcc", marginRight: "10px" },
  badge: { background: "#222", padding: "4px 8px" },
  upgrade: { background: "#00ffcc", padding: "5px 10px" },
  blur: { filter: "blur(6px)", pointerEvents: "none" },
  lock: { marginTop: "10px", color: "red" },
};