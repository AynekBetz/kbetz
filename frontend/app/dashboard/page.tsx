"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [topPick, setTopPick] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setUser(data);

      setLoading(false);

      fetchGames();
      setInterval(fetchGames, 5000);

    } catch {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  // ================= AI =================
  const impliedProb = (odds: number) => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
  };

  const generateAI = (games: any[]) => {
    let best = null;

    games.forEach((g) => {
      const prob = impliedProb(g.odds);
      const trueProb = prob + 0.04;
      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      if (!best || ev > best.ev) {
        best = { ...g, ev };
      }
    });

    setTopPick(best);
  };

  // ================= ALERT =================
  const createAlert = (text: string) => {
    const id = Date.now();
    setAlerts((prev) => [{ id, text }, ...prev].slice(0, 5));

    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 4000);
  };

  const playSound = () => {
    try {
      new Audio("/alert.mp3").play();
    } catch {}
  };

  // ================= FETCH =================
  const fetchGames = async () => {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    const newGames = data.games || [];

    const updatedPrev = { ...prevOdds };

    newGames.forEach((g: any) => {
      const prev = prevOdds[g.id];

      if (prev !== undefined) {
        const diff = g.odds - prev;

        if (Math.abs(diff) >= 5) {
          createAlert(
            diff > 0
              ? `🔴 Odds worsening: ${g.away} @ ${g.home}`
              : `🟢 Odds improving: ${g.away} @ ${g.home}`
          );
          playSound();
        }
      }

      updatedPrev[g.id] = g.odds;
    });

    setPrevOdds(updatedPrev);
    setGames(newGames);
    generateAI(newGames);
  };

  // ================= UPGRADE =================
  const upgrade = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (data.url) window.location.href = data.url;
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  return (
    <div style={{
      background: "#050505",
      minHeight: "100vh",
      color: "white",
      padding: "20px"
    }}>
      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "20px"
      }}>
        <h1 style={{
          background: "linear-gradient(90deg, #a855f7, #22c55e)",
          WebkitBackgroundClip: "text",
          color: "transparent"
        }}>
          KBETZ TERMINAL
        </h1>

        <div>
          <span style={{ marginRight: 10 }}>{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* 🚨 LIVE SIGNALS */}
      <div style={{
        marginBottom: "20px",
        position: "relative"
      }}>
        <h2>🚨 LIVE SIGNALS</h2>

        <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
          {alerts.map((a) => (
            <div key={a.id}>{a.text}</div>
          ))}
        </div>

        {!isPro && (
          <button onClick={upgrade}>
            🔒 Unlock Live Signals
          </button>
        )}
      </div>

      {/* 🧠 AI PICK */}
      <div style={{
        marginBottom: "20px",
        position: "relative"
      }}>
        <h2>🧠 AI PICK</h2>

        <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
          {topPick && (
            <>
              <div>{topPick.away} @ {topPick.home}</div>
              <div>EV: {topPick.ev.toFixed(2)}</div>
            </>
          )}
        </div>

        {!isPro && (
          <button onClick={upgrade}>
            🔒 Unlock AI Picks
          </button>
        )}
      </div>

      {/* 📊 MARKETS */}
      <div>
        <h2>📊 Markets</h2>

        <div style={{ filter: isPro ? "none" : "blur(4px)" }}>
          {games.map((g) => (
            <div key={g.id}>
              {g.away} @ {g.home} ({g.odds}) — {g.book}
            </div>
          ))}
        </div>

        {!isPro && (
          <button onClick={upgrade}>
            🔒 Unlock Full Market View
          </button>
        )}
      </div>
    </div>
  );
}