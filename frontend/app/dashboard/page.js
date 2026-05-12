"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API =
    process.env.NEXT_PUBLIC_API_URL || "https://kbetz.onrender.com";

  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [stake, setStake] = useState(100);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/data`);
        const data = await res.json();

        if (Array.isArray(data?.games)) {
          setGames(data.games);
        } else {
          throw new Error();
        }
      } catch {
        setGames([
          { away: "Warriors", home: "Lakers", homeOdds: -110 },
          { away: "Heat", home: "Celtics", homeOdds: -105 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* ================= SAFE FUNCTIONS ================= */

  const safeGames = Array.isArray(games) ? games : [];
  const safeParlay = Array.isArray(parlay) ? parlay : [];

  const add = (g) => {
    if (!g || typeof g.homeOdds !== "number") return;

    setParlay((prev) => {
      if (!Array.isArray(prev)) return [g];
      return [...prev, g];
    });
  };

  const clear = () => setParlay([]);

  const oddsToDecimal = (o) =>
    typeof o === "number"
      ? o > 0
        ? 1 + o / 100
        : 1 + 100 / Math.abs(o)
      : 1;

  const totalOdds =
    safeParlay.length === 0
      ? 1
      : safeParlay.reduce((acc, g) => {
          if (!g || typeof g.homeOdds !== "number") return acc;
          return acc * oddsToDecimal(g.homeOdds);
        }, 1);

  const payout =
    Number.isFinite(stake * totalOdds)
      ? (stake * totalOdds).toFixed(2)
      : "0.00";

  if (loading) {
    return (
      <div style={{ padding: 40, color: "white" }}>
        Loading KBETZ...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.logo}>KBETZ TERMINAL</h1>

        <div>
          <span style={{ color: "#00ffcc" }}>LIVE</span>
        </div>
      </div>

      {/* MARKETS */}
      <div style={styles.box}>
        {safeGames.map((g, i) => (
          <div key={i} style={styles.row}>
            <span>
              {g?.away} @ {g?.home}
            </span>

            <span style={styles.odds} onClick={() => add(g)}>
              {typeof g?.homeOdds === "number"
                ? g.homeOdds
                : "--"}
            </span>
          </div>
        ))}
      </div>

      {/* SLIP */}
      <div style={styles.box}>
        <div>${stake}</div>
        <div>Legs: {safeParlay.length}</div>
        <div>Payout: ${payout}</div>

        <button onClick={clear}>Clear</button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background:
      "radial-gradient(circle at bottom,#5b21b6,#000)",
    color: "#00fff7",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  logo: {
    background:
      "linear-gradient(90deg,#8b5cf6,#22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  box: {
    marginTop: 20,
    background: "#111",
    padding: 15,
    borderRadius: 10,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    background: "#000",
    marginBottom: 8,
    borderRadius: 8,
  },
  odds: {
    color: "#00ffcc",
    cursor: "pointer",
  },
};