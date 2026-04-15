"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    checkAuth();
  }, []);

  // ================= AUTO LOGIN =================
  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(`${API}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={{
        background: "#050505",
        color: "white",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        Loading...
      </div>
    );
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
          <span style={{ marginRight: 10 }}>
            {user?.email}
          </span>

          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* ALERTS */}
      {alerts.map((a) => (
        <div key={a.id}>{a.text}</div>
      ))}

      {/* MARKETS */}
      {games.map((g) => (
        <div key={g.id}>
          {g.away} @ {g.home} ({g.odds}) — {g.book}
        </div>
      ))}
    </div>
  );
}