"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [signals, setSignals] = useState<string[]>([]);
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

    if (!token) return;

    try {
      const res = await fetch(`${API}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.log("USER ERROR:", err);
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
      console.log("FETCH ERROR:", err);
    }
  };

  // ================= 🔊 SOUND =================
  const playSound = () => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.play();
    } catch {}
  };

  // ================= 🚨 SIGNALS =================
  const generateSignals = (games: any[]) => {
    const newSignals: string[] = [];

    games.forEach((g) => {
      const rand = Math.random();

      if (rand > 0.75) {
        newSignals.push(`🚨 Steam move on ${g.away} @ ${g.home}`);
        playSound();
      }
    });

    setSignals(newSignals);
  };

  // ================= 💳 UPGRADE =================
  const upgrade = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Login first");
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

      const data = await res.json();

      if (!data.url) {
        alert("Checkout failed");
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      alert("Upgrade error");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>💰 KBETZ</h1>

      {!isPro && (
        <div style={{ color: "red", marginBottom: 10 }}>
          🔒 PRO required for full access
        </div>
      )}

      {/* 🔒 BLUR LOCK */}
      <div style={{
        filter: isPro ? "none" : "blur(6px)"
      }}>
        <h2>🚨 Signals</h2>
        {signals.map((s, i) => (
          <div key={i}>{s}</div>
        ))}

        <h2>Games</h2>
        {games.map((g) => (
          <div key={g.id}>
            {g.away} @ {g.home} ({g.odds})
          </div>
        ))}
      </div>

      {!isPro && (
        <button
          onClick={upgrade}
          style={{
            marginTop: 20,
            padding: 12,
            background: "gold",
            border: "none",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Upgrade to PRO
        </button>
      )}
    </div>
  );
}