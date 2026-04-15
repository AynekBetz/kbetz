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

    const interval = setInterval(fetchGames, 8000);
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

    const g = data.games || [];
    setGames(g);

    generateSignals(g);
  };

  const playSound = () => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.volume = 0.5;
      audio.play();
    } catch {}
  };

  const generateSignals = (games: any[]) => {
    const newSignals: string[] = [];

    games.forEach((g) => {
      const rand = Math.random();

      if (rand > 0.75) {
        newSignals.push(`🚨 STEAM: ${g.away} @ ${g.home}`);
        playSound();
      }
    });

    setSignals((prev) => [...newSignals, ...prev].slice(0, 5));
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
    } else {
      alert("Checkout failed");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "white",
      padding: "20px",
      fontFamily: "Arial"
    }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "bold",
          background: "linear-gradient(90deg, #a855f7, #22c55e)",
          WebkitBackgroundClip: "text",
          color: "transparent"
        }}>
          KBETZ TERMINAL
        </h1>

        {!isPro && (
          <button onClick={upgrade} style={{
            background: "linear-gradient(90deg, gold, orange)",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer"
          }}>
            Upgrade PRO
          </button>
        )}
      </div>

      {/* SIGNALS */}
      <div style={{
        background: "rgba(255,255,255,0.05)",
        padding: "15px",
        borderRadius: "12px",
        marginBottom: "20px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <h3 style={{ marginBottom: "10px" }}>🚨 LIVE SIGNALS</h3>

        {signals.length === 0 && <div>No signals yet...</div>}

        {signals.map((s, i) => (
          <div key={i} style={{
            padding: "6px 0",
            animation: "fade 0.3s ease"
          }}>
            {s}
          </div>
        ))}
      </div>

      {/* CONTENT GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "20px"
      }}>

        {/* GAMES */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          padding: "15px",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <h2 style={{ marginBottom: "10px" }}>📊 Markets</h2>

          <div style={{
            filter: isPro ? "none" : "blur(6px)"
          }}>
            {games.map((g) => (
              <div key={g.id} style={{
                padding: "12px",
                marginBottom: "10px",
                background: "#0a0a0a",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #1f1f1f",
                transition: "0.2s"
              }}>
                <div>
                  {g.away} @ {g.home}
                </div>

                <div style={{
                  color: "#22c55e",
                  fontWeight: "bold"
                }}>
                  {g.odds}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDE PANEL */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>

          {/* AI PICK */}
          <div style={{
            background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
            padding: "15px",
            borderRadius: "12px"
          }}>
            <h3>🧠 AI PICK</h3>

            <div style={{
              filter: isPro ? "none" : "blur(6px)",
              marginTop: "10px"
            }}>
              Best edge detected
            </div>

            {!isPro && (
              <div style={{ marginTop: "10px", fontSize: "12px" }}>
                🔒 PRO ONLY
              </div>
            )}
          </div>

          {/* STATUS */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            padding: "15px",
            borderRadius: "12px"
          }}>
            <h3>📡 STATUS</h3>
            <div>Live Data Active</div>
            <div>User: {user?.email || "Guest"}</div>
          </div>

        </div>
      </div>
    </div>
  );
}