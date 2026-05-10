"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [slip, setSlip] = useState([]);
  const [user, setUser] = useState({ pro: false });
  const [stake, setStake] = useState(100);

  /* ================= FETCH ================= */
  useEffect(() => {
    setGames([
      { id: 1, away: "Warriors", home: "Lakers", odds: -110, ev: 4.28 },
      { id: 2, away: "Heat", home: "Celtics", odds: -105, ev: 5.88 },
      { id: 3, away: "Bucks", home: "Knicks", odds: -120, ev: 6.1 },
      { id: 4, away: "Suns", home: "Clippers", odds: -115, ev: 3.9 },
    ]);
  }, []);

  /* ================= ACTIONS ================= */

  const addToSlip = (game) => {
    if (!game) return;

    setSlip((prev) => {
      if (prev.find((g) => g.id === game.id)) return prev;
      return [...prev, game];
    });
  };

  const clearSlip = () => setSlip([]);

  const handleUpgrade = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/checkout`
      );

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Upgrade failed");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("Connection failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  /* ================= PARLAY BUILDER ================= */

  const buildParlay = (type) => {
    let sorted = [...games].sort((a, b) => b.ev - a.ev);

    if (type === "safe") sorted = sorted.slice(0, 2);
    if (type === "balanced") sorted = sorted.slice(0, 3);
    if (type === "aggressive") sorted = sorted.slice(0, 4);

    setSlip(sorted);
  };

  /* ================= ODDS CALC ================= */

  const convertOdds = (odds) => {
    return odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  };

  const totalOdds =
    slip.length === 0
      ? 0
      : slip.reduce((acc, g) => acc * convertOdds(g.odds), 1);

  const payout =
    slip.length === 0 ? "0.00" : (stake * totalOdds).toFixed(2);

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logo}>KBETZ TERMINAL</div>

        <div style={styles.headerRight}>
          <span style={styles.live}>● LIVE</span>

          {user.pro ? (
            <span style={styles.proBadge}>PRO</span>
          ) : (
            <span style={styles.freeBadge}>FREE</span>
          )}

          {!user.pro && (
            <button style={styles.upgradeBtn} onClick={handleUpgrade}>
              Upgrade
            </button>
          )}

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* AI PICKS */}
      <div style={styles.aiPanel}>
        <h2>🧠 AI PICKS</h2>

        {!user.pro && (
          <div style={styles.blurOverlay}>
            🔒 Upgrade to unlock AI Picks
          </div>
        )}

        {games.map((g) => (
          <div key={g.id}>
            {g.away} @ {g.home}
            <div style={{ color: "#00ffcc" }}>EV: {g.ev}</div>
          </div>
        ))}
      </div>

      {/* PARLAY BUILDER */}
      <div style={styles.builder}>
        <h3>AI Parlay Builder</h3>

        {!user.pro && (
          <div style={styles.blurOverlay}>
            🔒 PRO Required
          </div>
        )}

        <button onClick={() => buildParlay("safe")} style={styles.btn}>
          Safe
        </button>
        <button onClick={() => buildParlay("balanced")} style={styles.btn}>
          Balanced
        </button>
        <button onClick={() => buildParlay("aggressive")} style={styles.btn}>
          Aggressive
        </button>

        <button onClick={clearSlip} style={styles.clearBtn}>
          Clear
        </button>
      </div>

      {/* MARKETS */}
      <div style={styles.marketPanel}>
        <h2>Markets</h2>

        {games.map((g) => (
          <div key={g.id} style={styles.row}>
            <span>
              {g.away} @ {g.home}
            </span>

            <span style={styles.odds} onClick={() => addToSlip(g)}>
              {g.odds}
            </span>
          </div>
        ))}
      </div>

      {/* SLIP */}
      <div style={styles.slip}>
        <h3>Bet Slip</h3>

        {slip.length === 0 && <div>No bets yet</div>}

        {slip.map((s) => (
          <div key={s.id}>
            {s.away} @ {s.home} ({s.odds})
          </div>
        ))}

        {slip.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              style={styles.input}
            />

            <div>Total Odds: {totalOdds.toFixed(2)}</div>
            <div style={{ color: "#00ffcc" }}>
              Payout: ${payout}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  ...{
    clearBtn: {
      marginLeft: 10,
      padding: "6px 12px",
      background: "#ff4444",
      color: "#fff",
      borderRadius: 6,
      cursor: "pointer",
    },
  },
};