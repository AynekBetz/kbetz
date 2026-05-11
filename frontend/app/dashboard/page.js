"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  console.log("🔥 CLEAN SAFE BUILD");

  const API =
    process.env.NEXT_PUBLIC_API_URL || "https://kbetz.onrender.com";

  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [stake, setStake] = useState(10);
  const [isPro, setIsPro] = useState(false);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetch(`${API}/api/data`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.games)) {
          setGames(d.games);
        } else {
          console.warn("Bad API response, using fallback");
          setGames([]);
        }
      })
      .catch(() => setGames([]));
  }, []);

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setIsPro(d?.plan === "PRO"))
      .catch(() => {});
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
      const res = await fetch(`${API}/api/checkout`, { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      alert("Upgrade failed");
    }
  };

  /* ================= CALC ================= */

  const americanToDecimal = (odds) => {
    if (!odds) return 1;
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

  const buildAIParlay = () => {
    const best = [...games]
      .filter((g) => typeof g.edgeScore === "number")
      .sort((a, b) => b.edgeScore - a.edgeScore)
      .slice(0, 3);

    setParlay(best);
  };

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
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
            {g?.away} @ {g?.home} — EV {g?.edgeScore || "N/A"}
          </div>
        ))}
      </div>

      {/* BUILDER */}
      <div style={styles.builder}>
        <button style={styles.btn} onClick={buildAIParlay}>
          Build AI Parlay
        </button>
      </div>

      {/* MARKETS */}
      <div style={styles.marketPanel}>
        <h2>Markets</h2>

        {Array.isArray(games) &&
          games.map((g, i) => (
            <div key={i} style={styles.row}>
              <span>
                {g?.away} @ {g?.home}
              </span>

              <span
                style={styles.odds}
                onClick={() => addToParlay(g)}
              >
                {g?.homeOdds || "--"}
              </span>
            </div>
          ))}
      </div>

      {/* SLIP */}
      <div style={styles.slip}>
        <h3>Bet Slip</h3>

        {parlay.map((p, i) => (
          <div key={i}>
            {p?.away} @ {p?.home}
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

/* ================= STYLES ================= */

const styles = {
  page: {
    background: "#000",
    color: "#fff",
    padding: "20px",
    minHeight: "100vh",
  },
  header: { display: "flex", justifyContent: "space-between" },
  headerRight: { display: "flex", gap: 10, alignItems: "center" },
  logo: { fontSize: 30 },
  live: { color: "#0ff" },
  proBadge: { background: "#0ff", color: "#000", padding: 5 },
  freeBadge: { background: "#333", padding: 5 },
  upgradeBtn: { background: "#0ff", color: "#000", padding: 5 },
  logoutBtn: { background: "#222", color: "#fff", padding: 5 },
  aiPanel: { marginTop: 20 },
  builder: { marginTop: 20 },
  btn: { background: "#0ff", padding: 5 },
  marketPanel: { marginTop: 20 },
  row: { display: "flex", justifyContent: "space-between" },
  odds: { color: "#0ff", cursor: "pointer" },
  slip: { marginTop: 20 },
  clearBtn: { background: "red", color: "#fff", padding: 5 },
  input: { marginTop: 10 },
};