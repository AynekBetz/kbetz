"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [signals, setSignals] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchGames();
    fetchUser();

    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setUser(data);
  };

  const fetchGames = async () => {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    const newGames = data.games || [];

    // store previous odds
    const prev = { ...prevOdds };
    const updatedPrev: any = {};

    newGames.forEach((g: any) => {
      updatedPrev[g.id] = prev[g.id] ?? g.odds;
    });

    setPrevOdds(updatedPrev);
    setGames(newGames);

    generateSignals(newGames);
  };

  const generateSignals = (games: any[]) => {
    const newSignals: string[] = [];

    games.forEach((g) => {
      const rand = Math.random();
      if (rand > 0.8) {
        newSignals.push(`🚨 Steam: ${g.away} @ ${g.home}`);
      }
    });

    setSignals((prev) => [...newSignals, ...prev].slice(0, 5));
  };

  const getMovement = (id: number, odds: number) => {
    const prev = prevOdds[id];
    if (prev === undefined) return { color: "white", arrow: "" };

    if (odds > prev) {
      return { color: "#ef4444", arrow: "⬆️" }; // worse
    } else if (odds < prev) {
      return { color: "#22c55e", arrow: "⬇️" }; // better
    } else {
      return { color: "white", arrow: "" };
    }
  };

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

    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div style={{
      background: "#050505",
      minHeight: "100vh",
      color: "white",
      padding: "20px"
    }}>
      <h1 style={{
        background: "linear-gradient(90deg, #a855f7, #22c55e)",
        WebkitBackgroundClip: "text",
        color: "transparent"
      }}>
        KBETZ LIVE TERMINAL
      </h1>

      {!isPro && (
        <button onClick={upgrade} style={{
          background: "gold",
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "6px"
        }}>
          Upgrade PRO
        </button>
      )}

      {/* SIGNALS */}
      <div style={{
        background: "#111",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <h3>🚨 Signals</h3>
        {signals.map((s, i) => (
          <div key={i}>{s}</div>
        ))}
      </div>

      {/* GAMES */}
      <div style={{
        filter: isPro ? "none" : "blur(6px)"
      }}>
        {games.map((g) => {
          const movement = getMovement(g.id, g.odds);

          return (
            <div key={g.id} style={{
              padding: "12px",
              marginBottom: "10px",
              background: "#0a0a0a",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "0.3s",
              boxShadow: `0 0 10px ${movement.color}`
            }}>
              <div>{g.away} @ {g.home}</div>

              <div style={{
                color: movement.color,
                fontWeight: "bold",
                fontSize: "18px"
              }}>
                {movement.arrow} {g.odds}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}