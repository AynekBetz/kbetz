"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API =
    process.env.NEXT_PUBLIC_API_URL || "https://kbetz.onrender.com";

  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [stake, setStake] = useState(100);
  const [mode, setMode] = useState("balanced");
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/data`);
        const data = await res.json();

        if (Array.isArray(data?.games)) {
          setGames(data.games);
        } else {
          throw new Error("Invalid data");
        }
      } catch (err) {
        console.log("Fallback data used");
        setGames([
          {
            away: "Warriors",
            home: "Lakers",
            homeOdds: -110,
            edgeScore: 4.2,
          },
          {
            away: "Heat",
            home: "Celtics",
            homeOdds: -105,
            edgeScore: 5.8,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ================= AUTH ================= */
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setIsPro(d?.plan === "PRO"))
        .catch(() => {});
    } catch {}
  }, []);

  /* ================= ACTIONS ================= */

  const addToParlay = (game) => {
    if (!game) return;
    setParlay((p) => [...p, game]);
  };

  const clearParlay = () => setParlay([]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const upgrade = async () => {
    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      alert("Upgrade failed");
    }
  };

  /* ================= ODDS ================= */

  const americanToDecimal = (odds) => {
    if (!odds || isNaN(odds)) return 1;
    return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
  };

  const totalOdds =
    parlay.length === 0
      ? 1
      : parlay.reduce(
          (acc, g) => acc * americanToDecimal(g?.homeOdds),
          1
        );

  const payout = (stake * totalOdds).toFixed(2);

  /* ================= AI BUILDER ================= */

  const buildAIParlay = (type) => {
    setMode(type);

    let sorted = [...games].sort(
      (a, b) => (b?.edgeScore || 0) - (a?.edgeScore || 0)
    );

    if (type === "safe") sorted = sorted.slice(0, 2);
    if (type === "balanced") sorted = sorted.slice(0, 3);
    if (type === "aggressive") sorted = sorted.slice(0, 4);

    setParlay(sorted);
  };

  /* ================= LOADING GUARD ================= */

  if (loading) {
    return (
      <div style={styles.page}>
        <h2>Loading KBETZ...</h2>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.logo}>KBETZ TERMINAL</h1>

        <div style={styles.headerRight}>
          <span style={styles.live}>• LIVE</span>

          <span style={styles.freeBadge}>
            {isPro ? "PRO" : "FREE"}
          </span>

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

      {/* TICKER */}
      <div style={styles.ticker}>
        {games.map((g, i) => (
          <span key={i}>
            {g?.away}@{g?.home} {g?.homeOdds}
          </span>
        ))}
      </div>

      {/* ALERT */}
      <div style={styles.panel}>Alert History</div>

      {/* AI BUILDER */}
      <div style={styles.builder}>
        <h3>AI Builder</h3>

        <div>
          <button onClick={() => buildAIParlay("safe")}>
            Safe
          </button>
          <button onClick={() => buildAIParlay("balanced")}>
            Balanced
          </button>
          <button onClick={() => buildAIParlay("aggressive")}>
            Aggressive
          </button>
        </div>
      </div>

      {/* MARKETS */}
      <div style={styles.market}>
        {games.map((g, i) => (
          <div key={i} style={styles.row}>
            <span>
              {g?.away} @ {g?.home}
            </span>

            <span
              style={styles.odds}
              onClick={() => addToParlay(g)}
            >
              {g?.homeOdds}
            </span>
          </div>
        ))}
      </div>

      {/* BET SLIP */}
      <div style={styles.slip}>
        <div>${stake.toFixed(2)}</div>
        <div>Parlay: {parlay.length} legs</div>
        <div>Payout: ${payout}</div>

        <button onClick={clearParlay}>Clear</button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    color: "#00fff7",
    background:
      "radial-gradient(circle at 50% 100%, #5b21b6, #000)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
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
      "linear-gradient(90deg,#8b5cf6,#22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  live: { color: "#00ffcc" },
  freeBadge: { background: "#333", padding: "4px 10px" },
  upgradeBtn: {
    background: "#00ffcc",
    color: "#000",
    padding: "6px 12px",
  },
  logoutBtn: {
    background: "#222",
    color: "#fff",
    padding: "6px 12px",
  },
  ticker: {
    marginTop: "10px",
    display: "flex",
    gap: "20px",
  },
  panel: {
    marginTop: "20px",
    background: "#111",
    padding: "15px",
    borderRadius: "10px",
  },
  builder: {
    marginTop: "20px",
    background:
      "linear-gradient(90deg,#7c3aed,#22d3ee)",
    padding: "15px",
    borderRadius: "10px",
  },
  market: { marginTop: "20px" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    background: "#000",
    marginBottom: "8px",
    borderRadius: "10px",
  },
  odds: { color: "#00ffcc", cursor: "pointer" },
  slip: {
    marginTop: "20px",
    background: "#111",
    padding: "15px",
    borderRadius: "10px",
  },
};// force rebuild
