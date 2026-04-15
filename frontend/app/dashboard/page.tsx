"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchGames();
    fetchUser();

    const interval = setInterval(fetchGames, 4000);
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

  const playSound = () => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.volume = 1;
      audio.play();
    } catch {}
  };

  const fetchGames = async () => {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    const newGames = data.games || [];

    const updatedPrev: any = { ...prevOdds };

    newGames.forEach((g: any) => {
      const prev = prevOdds[g.id];

      if (prev !== undefined) {
        const diff = g.odds - prev;

        if (Math.abs(diff) >= 5) {
          createAlert(
            diff > 0
              ? `🔴 Odds Worsening: ${g.away} @ ${g.home}`
              : `🟢 Odds Improving: ${g.away} @ ${g.home}`
          );

          playSound();
        }
      }

      updatedPrev[g.id] = g.odds;
    });

    setPrevOdds(updatedPrev);
    setGames(newGames);
  };

  const createAlert = (text: string) => {
    const id = Date.now();

    setAlerts((prev) => [{ id, text }, ...prev].slice(0, 5));

    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 4000);
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

      {/* HEADER */}
      <h1 style={{
        background: "linear-gradient(90deg, #a855f7, #22c55e)",
        WebkitBackgroundClip: "text",
        color: "transparent",
        fontSize: "28px"
      }}>
        KBETZ AI TERMINAL
      </h1>

      {/* 🚨 ALERTS */}
      <div style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 999
      }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: "#111",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            border: "1px solid #333"
          }}>
            {a.text}
          </div>
        ))}
      </div>

      {/* 🧠 AI BET CARD */}
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
        padding: "20px",
        borderRadius: "16px",
        marginBottom: "20px",
        overflow: "hidden"
      }}>
        <h2>🧠 AI BEST BET</h2>

        <div style={{
          marginTop: "10px",
          fontSize: "18px",
          filter: isPro ? "none" : "blur(8px)"
        }}>
          Lakers ML -110  
          <br />
          Confidence: HIGH  
          <br />
          Edge: +8.2%
        </div>

        {/* 🔒 LOCK OVERLAY */}
        {!isPro && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>
              🔒 PRO ONLY
            </div>

            <button onClick={upgrade} style={{
              background: "gold",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer"
            }}>
              Unlock AI Picks
            </button>
          </div>
        )}
      </div>

      {/* 📊 GAMES */}
      <div style={{
        filter: isPro ? "none" : "blur(5px)"
      }}>
        {games.map((g) => {
          const prev = prevOdds[g.id];

          let color = "white";
          let arrow = "";

          if (prev !== undefined) {
            if (g.odds > prev) {
              color = "#ef4444";
              arrow = "⬆️";
            } else if (g.odds < prev) {
              color = "#22c55e";
              arrow = "⬇️";
            }
          }

          return (
            <div key={g.id} style={{
              padding: "12px",
              marginBottom: "10px",
              background: "#0a0a0a",
              borderRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              boxShadow: `0 0 10px ${color}`
            }}>
              <div>{g.away} @ {g.home}</div>

              <div style={{ color, fontWeight: "bold" }}>
                {arrow} {g.odds}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}