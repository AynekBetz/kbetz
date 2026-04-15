"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [topPicks, setTopPicks] = useState<any[]>([]);
  const [parlay, setParlay] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchUser();
    fetchGames();

    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= USER =================
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setUser(data);
  };

  // ================= IMPLIED PROB =================
  const impliedProb = (odds: number) => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
  };

  // ================= AI ENGINE =================
  const generateAI = (games: any[]) => {
    const evaluated = games.map((g) => {
      const prob = impliedProb(g.odds);

      // simple edge logic
      const trueProb = prob + 0.03;
      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      return { ...g, ev };
    });

    const sorted = evaluated.sort((a, b) => b.ev - a.ev);

    setTopPicks(sorted.slice(0, 3));

    if (sorted.length >= 2) {
      const p1 = sorted[0];
      const p2 = sorted[1];

      const d1 = p1.odds < 0 ? 1 + 100 / Math.abs(p1.odds) : 1 + p1.odds / 100;
      const d2 = p2.odds < 0 ? 1 + 100 / Math.abs(p2.odds) : 1 + p2.odds / 100;

      const combined = ((d1 * d2) - 1) * 100;

      setParlay({
        legs: [p1, p2],
        odds: combined.toFixed(2),
      });
    }
  };

  // ================= ALERT =================
  const createAlert = (text: string) => {
    const id = Date.now();

    setAlerts((prev) => [{ id, text }, ...prev].slice(0, 5));

    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 4000);
  };

  // ================= SOUND =================
  const playSound = () => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.play();
    } catch {}
  };

  // ================= FETCH =================
  const fetchGames = async () => {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    const g = data.games || [];
    setGames(g);

    generateAI(g);

    // trigger fake alerts
    if (Math.random() > 0.7) {
      createAlert("🚨 Market movement detected");
      playSound();
    }
  };

  // ================= UPGRADE =================
  const upgrade = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

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

  return (
    <div style={{
      background: "#050505",
      minHeight: "100vh",
      color: "white",
      padding: "20px"
    }}>
      {/* HEADER */}
      <h1 style={{
        background: "linear-gradient(90deg, #a855f7, #22c55e)",
        WebkitBackgroundClip: "text",
        color: "transparent"
      }}>
        KBETZ TERMINAL
      </h1>

      {/* UPGRADE */}
      {!isPro && (
        <button onClick={upgrade} style={{ marginBottom: 20 }}>
          Upgrade PRO
        </button>
      )}

      {/* ALERTS */}
      {alerts.map((a) => (
        <div key={a.id}>{a.text}</div>
      ))}

      {/* AI PICKS */}
      <div style={{ marginBottom: 20 }}>
        <h2>🧠 AI PICKS</h2>

        <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
          {topPicks.map((p, i) => (
            <div key={i}>
              {p.away} @ {p.home} — EV: {p.ev.toFixed(2)}
            </div>
          ))}
        </div>
      </div>

      {/* PARLAY */}
      {parlay && (
        <div style={{ marginBottom: 20 }}>
          <h2>🎯 AI PARLAY</h2>

          <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
            {parlay.legs.map((l: any, i: number) => (
              <div key={i}>{l.away} @ {l.home}</div>
            ))}

            <div>Odds: +{parlay.odds}</div>
          </div>
        </div>
      )}

      {/* GAMES */}
      <div style={{
        filter: isPro ? "none" : "blur(6px)"
      }}>
        {games.map((g) => (
          <div key={g.id}>
            {g.away} @ {g.home} ({g.odds})
          </div>
        ))}
      </div>
    </div>
  );
}