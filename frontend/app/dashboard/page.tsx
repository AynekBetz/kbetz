"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [signals, setSignals] = useState<string[]>([]);
  const [parlay, setParlay] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchGames();
    fetchUser();

    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, []);

  // ================= USER =================
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    console.log("FETCH USER TOKEN:", token);

    if (!token) return;

    try {
      const res = await fetch(`${API}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("USER DATA:", data);

      setUser(data);
    } catch (err) {
      console.log("USER FETCH ERROR:", err);
    }
  };

  // ================= GAMES =================
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API}/api/data`);
      const data = await res.json();

      const g = data.games || [];
      setGames(g);

      generateSignals(g);
    } catch (err) {
      console.log("FETCH GAMES ERROR:", err);
    }
  };

  // ================= SIGNALS =================
  const generateSignals = (games: any[]) => {
    const newSignals: string[] = [];

    games.forEach((g) => {
      const rand = Math.random();

      if (rand > 0.8) {
        newSignals.push(`🚨 Steam move on ${g.away} @ ${g.home}`);
      } else if (rand > 0.6) {
        newSignals.push(`💰 Sharp money on ${g.home}`);
      } else if (rand > 0.4) {
        newSignals.push(`🎯 Value spot: ${g.away}`);
      }
    });

    setSignals((prev) => [...newSignals, ...prev].slice(0, 6));
  };

  // ================= PARLAY =================
  const addToParlay = (game: any) => {
    if (parlay.find((p) => p.id === game.id)) return;
    setParlay([...parlay, game]);
  };

  const removeFromParlay = (id: number) => {
    setParlay(parlay.filter((p) => p.id !== id));
  };

  const calcParlayOdds = () => {
    if (!parlay.length) return "0.00";

    let total = 1;

    parlay.forEach((p) => {
      const decimal =
        p.odds < 0
          ? 1 + 100 / Math.abs(p.odds)
          : 1 + p.odds / 100;

      total *= decimal;
    });

    return ((total - 1) * 100).toFixed(2);
  };

  // ================= 🚨 FIXED UPGRADE =================
  const upgrade = async () => {
    console.log("🔥 CLICKED UPGRADE");

    const token = localStorage.getItem("token");
    console.log("TOKEN:", token);

    if (!token) {
      alert("❌ Not logged in → redirecting to login");
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      console.log("RAW RESPONSE:", res);

      const data = await res.json();
      console.log("CHECKOUT DATA:", data);

      if (!data.url) {
        alert("❌ No Stripe URL returned — check backend");
        return;
      }

      alert("✅ Redirecting to Stripe...");
      window.location.href = data.url;

    } catch (err) {
      console.log("UPGRADE ERROR:", err);
      alert("❌ Upgrade failed");
    }
  };

  // ================= UI =================
  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <h1>💰 KBETZ LIVE TERMINAL</h1>

      {/* 🚨 SIGNALS */}
      <div style={{
        background: "#111",
        padding: 10,
        marginBottom: 15,
        borderRadius: 8
      }}>
        <h3>🚨 LIVE SIGNALS</h3>
        {signals.map((s, i) => (
          <div key={i}>{s}</div>
        ))}
      </div>

      {/* 🔒 PRO LOCK */}
      {!isPro && (
        <div style={{ color: "red", marginBottom: 10 }}>
          🔒 Upgrade to PRO to unlock AI + alerts
        </div>
      )}

      {/* 🎯 PARLAY BUILDER */}
      <div style={{
        background: "#0a0a0a",
        padding: 15,
        marginBottom: 20,
        borderRadius: 10
      }}>
        <h2>🎯 Parlay Builder</h2>

        {parlay.map((p) => (
          <div key={p.id}>
            {p.away} @ {p.home} ({p.odds})
            <button onClick={() => removeFromParlay(p.id)}>❌</button>
          </div>
        ))}

        <div style={{ marginTop: 10 }}>
          💰 Parlay Odds: {calcParlayOdds()}
        </div>
      </div>

      {/* 💳 UPGRADE BUTTON */}
      {!isPro && (
        <button
          onClick={upgrade}
          style={{
            marginBottom: 20,
            background: "gold",
            padding: 12,
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Upgrade to PRO
        </button>
      )}

      {/* 📊 GAMES */}
      <h2>Games</h2>

      {games.map((g) => (
        <div
          key={g.id}
          style={{
            padding: 10,
            marginBottom: 10,
            background: "#111",
            borderRadius: 8
          }}
        >
          {g.away} @ {g.home} ({g.odds})

          <button
            onClick={() => addToParlay(g)}
            style={{ marginLeft: 10 }}
          >
            ➕ Add
          </button>
        </div>
      ))}
    </div>
  );
}