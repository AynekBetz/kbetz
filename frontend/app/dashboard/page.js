"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [stake, setStake] = useState(10);
  const [isPro, setIsPro] = useState(false);

  // FETCH DATA
  useEffect(() => {
    fetch(`${API}/api/data`)
      .then((r) => r.json())
      .then((d) => setGames(d.games || []))
      .catch(() => {});
  }, []);

  // AUTH CHECK
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setIsPro(d.plan === "PRO"))
      .catch(() => {});
  }, []);

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    location.href = "/login";
  };

  // STRIPE
  const upgrade = async () => {
    const res = await fetch(`${API}/api/checkout`, {
      method: "POST",
    });
    const data = await res.json();
    window.location.href = data.url;
  };

  // PARLAY LOGIC
  const addToParlay = (game) => {
    setParlay((p) => [...p, game]);
  };

  const clearParlay = () => setParlay([]);

  const americanToDecimal = (odds) => {
    if (odds > 0) return 1 + odds / 100;
    return 1 + 100 / Math.abs(odds);
  };

  const totalOdds =
    parlay.reduce((acc, g) => acc * americanToDecimal(g.homeOdds), 1) || 1;

  const payout = (stake * totalOdds).toFixed(2);

  // SMART AI PARLAY (simple but real)
  const buildAIParlay = () => {
    const best = [...games]
      .sort((a, b) => b.edgeScore - a.edgeScore)
      .slice(0, 3);
    setParlay(best);
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.logo}>KBETZ TERMINAL</h1>

        <div style={styles.headerRight}>
          <span style={styles.live}>LIVE</span>

          {isPro ? (
            <span style={styles.proBadge}>PRO</span>
          ) : (
            <span style={styles.freeBadge}>FREE</span>
          )}

          {!isPro && (
            <button style={styles.upgradeBtn} onClick={upgrade}>
              Upgrade
            </button>
          )}

          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* AI PICKS */}
      <div style={styles.aiPanel}>
        <h2>🧠 AI PICKS</h2>

        {games.slice(0, 2).map((g, i) => (
          <div key={i}>
            {g.away} @ {g.home} — EV {g.edgeScore}
          </div>
        ))}
      </div>

      {/* AI PARLAY BUILDER */}
      <div style={styles.builder}>
        <h3>⚡ AI PARLAY BUILDER</h3>

        <button style={styles.btn} onClick={buildAIParlay}>
          Build Smart Parlay
        </button>

        {!isPro && (
          <div style={styles.blurOverlay}>
            🔒 Upgrade for AI Builder
          </div>
        )}
      </div>

      {/* MARKETS */}
      <div style={styles.marketPanel}>
        <h2>Markets</h2>

        {games.map((g, i) => (
          <div key={i} style={styles.row}>
            <span>
              {g.away} @ {g.home}
            </span>

            <span
              style={styles.odds}
              onClick={() => addToParlay(g)}
            >
              {g.homeOdds}
            </span>
          </div>
        ))}
      </div>

      {/* BET SLIP */}
      <div style={styles.slip}>
        <h3>Bet Slip</h3>

        {parlay.map((p, i) => (
          <div key={i}>
            {p.away} @ {p.home}
          </div>
        ))}

        <input
          type="number"
          value={stake}
          onChange={(e) => setStake(Number(e.target.value))}
          style={styles.input}
        />

        <div>Total Odds: {totalOdds.toFixed(2)}</div>
        <div>Payout: ${payout}</div>

        <button style={styles.clearBtn} onClick={clearParlay}>
          Clear
        </button>
      </div>
    </div>
  );
}

// ✅ FIXED STYLES (NO CRASH)
const styles = {
  page: {
    background:
      "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.15), transparent 40%), #000",
    color: "#fff",
    padding: "20px",
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  headerRight: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  logo: {
    fontSize: "32px",
    fontWeight: "900",
    background:
      "linear-gradient(90deg,#8b5cf6,#22d3ee,#00ffcc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  live: { color: "#00ffcc" },

  proBadge: {
    background: "#00ffcc",
    color: "#000",
    padding: "4px 10px",
    borderRadius: "6px",
  },

  freeBadge: {
    background: "#333",
    color: "#aaa",
    padding: "4px 10px",
    borderRadius: "6px",
  },

  upgradeBtn: {
    background: "#00ffcc",
    color: "#000",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  logoutBtn: {
    background: "#222",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  aiPanel: {
    background:
      "linear-gradient(135deg,#7c3aed,#22d3ee33)",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "15px",
  },

  builder: {
    position: "relative",
    marginBottom: "15px",
  },

  blurOverlay: {
    position: "absolute",
    inset: 0,
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  btn: {
    marginRight: 10,
    padding: "6px 12px",
    background: "#00ffcc",
    color: "#000",
    borderRadius: 6,
    cursor: "pointer",
  },

  clearBtn: {
    marginTop: 10,
    padding: "6px 12px",
    background: "#ff4444",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
  },

  marketPanel: {
    background: "rgba(20,10,40,0.6)",
    padding: "15px",
    borderRadius: "12px",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    background: "#000",
    marginBottom: "8px",
    borderRadius: "10px",
  },

  odds: {
    color: "#00ffcc",
    fontWeight: "bold",
    cursor: "pointer",
  },

  slip: {
    marginTop: "20px",
    background: "rgba(20,10,40,0.6)",
    padding: "15px",
    borderRadius: "12px",
  },

  input: {
    padding: "6px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "none",
  },
};