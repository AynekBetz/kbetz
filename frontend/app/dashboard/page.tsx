"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchUser();
    fetchGames();

    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  // USER
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.log(err);
    }
  };

  // GAMES
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API}/api/data`);
      const data = await res.json();

      setGames(data.games || []);

      // fake alert trigger
      if (Math.random() > 0.7) {
        createAlert("🚨 Market movement detected");
        playSound();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ALERT
  const createAlert = (text: string) => {
    const id = Date.now();
    setAlerts((prev) => [{ id, text }, ...prev].slice(0, 5));

    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 4000);
  };

  // SOUND
  const playSound = () => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.play();
    } catch {}
  };

  // UPGRADE
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
      <h1 style={{
        background: "linear-gradient(90deg, #a855f7, #22c55e)",
        WebkitBackgroundClip: "text",
        color: "transparent"
      }}>
        KBETZ TERMINAL
      </h1>

      {!isPro && (
        <button onClick={upgrade} style={{ marginBottom: 20 }}>
          Upgrade PRO
        </button>
      )}

      {/* ALERTS */}
      {alerts.map((a) => (
        <div key={a.id}>{a.text}</div>
      ))}

      {/* LOCKED CONTENT */}
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