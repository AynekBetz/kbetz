"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [topPick, setTopPick] = useState<any>(null);

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

    const res = await fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setUser(data);
  };

  // AI
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

  // ALERT
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

  // FETCH
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

  const upgrade = () => {
    window.location.href = "/login";
  };

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

        {!isPro && (
          <button onClick={upgrade} style={{
            background: "gold",
            padding: "10px",
            borderRadius: "8px"
          }}>
            Upgrade PRO
          </button>
        )}
      </div>

      {/* LIVE SIGNALS */}
      <div style={{
        background: "#0a0a0a",
        padding: "15px",
        borderRadius: "12px",
        marginBottom: "20px"
      }}>
        <h2>🚨 LIVE SIGNALS</h2>

        {alerts.map(a => (
          <div key={a.id}>{a.text}</div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "20px"
      }}>

        {/* MARKETS */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          padding: "20px",
          borderRadius: "12px"
        }}>
          <h2>📊 Markets</h2>

          <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
            {games.map(g => {
              const prev = prevOdds[g.id];

              let color = "white";
              let arrow = "";

              if (prev !== undefined) {
                if (g.odds > prev) {
                  color = "#ef4444";
                  arrow = "⬆";
                } else if (g.odds < prev) {
                  color = "#22c55e";
                  arrow = "⬇";
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
                  border: color !== "white" ? `1px solid ${color}` : "none",
                  boxShadow: color !== "white" ? `0 0 12px ${color}` : "none",
                  transition: "0.3s"
                }}>
                  <div>
                    {g.away} @ {g.home}
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {g.sport} • {g.book}
                    </div>
                  </div>

                  <div style={{
                    color,
                    fontWeight: "bold",
                    fontSize: "16px"
                  }}>
                    {arrow} {g.odds}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>

          {/* AI PICK */}
          {topPick && (
            <div style={{
              background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px"
            }}>
              <h2>🧠 AI PICK</h2>

              <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
                {topPick.away} @ {topPick.home}
                <div>EV: {topPick.ev.toFixed(2)}</div>
              </div>

              {!isPro && <div>🔒 PRO ONLY</div>}
            </div>
          )}

          {/* STATUS */}
          <div style={{
            background: "#0a0a0a",
            padding: "15px",
            borderRadius: "12px"
          }}>
            <h3>📡 STATUS</h3>
            <div>Live Data Active</div>
            <div>User: {user ? user.email : "Guest"}</div>
          </div>

        </div>
      </div>
    </div>
  );
}