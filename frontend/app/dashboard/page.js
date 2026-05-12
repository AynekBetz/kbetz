"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState([]);
  const [stake, setStake] = useState(100);
  const [parlayOdds, setParlayOdds] = useState(0);

  // ✅ SAFE FETCH
  useEffect(() => {
    fetch(`${API}/api/data`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.games)) {
          setGames(data.games);
        } else {
          setGames([]);
        }
      })
      .catch(() => setGames([]));
  }, []);

  // ✅ ADD PICK (NO CRASH)
  const addPick = (game) => {
    if (!game) return;

    setPicks((prev) => {
      const exists = prev.find((p) => p.id === game.id);
      if (exists) return prev;
      return [...prev, game];
    });
  };

  // ✅ PARLAY CALC (SAFE)
  useEffect(() => {
    if (!Array.isArray(picks)) return;

    let total = 1;

    picks.forEach((p) => {
      if (!p || !p.odds) return;

      const dec =
        p.odds > 0 ? 1 + p.odds / 100 : 1 + 100 / Math.abs(p.odds);

      total *= dec;
    });

    setParlayOdds(total);
  }, [picks]);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.logo}>KBETZ TERMINAL</h1>
        <div>
          <span style={styles.live}>LIVE</span>
          <button style={styles.btn}>Logout</button>
        </div>
      </div>

      {/* AI PICKS */}
      <div style={styles.card}>
        <h2>🧠 AI PICKS</h2>

        {Array.isArray(games) &&
          games.slice(0, 3).map((g) => (
            <div key={g.id}>
              {g.away} @ {g.home}
            </div>
          ))}
      </div>

      {/* MARKETS */}
      <div style={styles.card}>
        <h2>Markets</h2>

        {Array.isArray(games) &&
          games.map((g) => (
            <div
              key={g.id}
              style={styles.market}
              onClick={() => addPick(g)}
            >
              {g.away} @ {g.home}
              <span>{g.odds || "-110"}</span>
            </div>
          ))}
      </div>

      {/* PARLAY BUILDER */}
      <div style={styles.card}>
        <h2>💰 Parlay Builder</h2>

        <div>Stake: ${stake}</div>
        <div>Legs: {picks.length}</div>

        <div>
          Payout: $
          {(stake * parlayOdds).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(#000, #3b0a75)",
    minHeight: "100vh",
    padding: 20,
    color: "#fff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  logo: {
    background: "linear-gradient(to right, #6ee7ff, #a855f7)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  live: {
    color: "#00ffcc",
    marginRight: 10,
  },
  btn: {
    padding: "6px 10px",
    background: "#111",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
  },
  card: {
    background: "rgba(20,0,40,0.9)",
    padding: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  market: {
    display: "flex",
    justifyContent: "space-between",
    background: "#000",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    cursor: "pointer",
  },
};