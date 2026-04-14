"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchGames();
    fetchUser();
  }, []);

  const fetchGames = async () => {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();
    setGames(data.games || []);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    setUser(data);
  };

  const upgrade = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>KBETZ Dashboard</h1>

      {!isPro && (
        <div style={{ color: "red" }}>
          🔒 PRO required for AI picks
        </div>
      )}

      <div style={{
        filter: isPro ? "none" : "blur(5px)",
        marginBottom: 20
      }}>
        <h2>🧠 AI PICK</h2>
        <div>Best bet will show here</div>
      </div>

      {!isPro && (
        <button onClick={upgrade}>
          Upgrade to PRO
        </button>
      )}

      <h2>Games</h2>
      {games.map((g) => (
        <div key={g.id}>
          {g.away} @ {g.home} ({g.odds})
        </div>
      ))}
    </div>
  );
}