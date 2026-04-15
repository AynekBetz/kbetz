"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [topPicks, setTopPicks] = useState<any[]>([]);
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

  const impliedProb = (odds: number) => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
  };

  const generateAI = (games: any[], prevOdds: any) => {
    const evaluated = games.map((g) => {
      const prob = impliedProb(g.odds);
      const prev = prevOdds[g.id];

      let momentum = 0;
      if (prev !== undefined) momentum = g.odds - prev;

      let trueProb = prob;
      if (momentum < 0) trueProb += 0.04;
      if (momentum > 0) trueProb -= 0.03;

      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      return {
        ...g,
        ev,
      };
    });

    const sorted = evaluated.sort((a, b) => b.ev - a.ev);
    setTopPicks(sorted.slice(0, 3));
  };

  const fetchGames = async () => {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    const newGames = data.games || [];
    const updatedPrev = { ...prevOdds };

    newGames.forEach((g: any) => {
      updatedPrev[g.id] = g.odds;
    });

    setPrevOdds(updatedPrev);
    setGames(newGames);

    generateAI(newGames, updatedPrev);
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

    if (data.url) window.location.href = data.url;
  };

  return (
    <div style={{
      background: "#050505",
      minHeight: "100vh",
      color: "white",
      padding: "20px",
      fontFamily: "Inter, sans-serif"
    }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "25px"
      }}>
        <h1 style={{
          fontSize: "28px",
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
            cursor: "pointer",
            transition: "0.2s"
          }}>
            Upgrade PRO
          </button>
        )}
      </div>

      {/* AI PICKS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "15px",
        marginBottom: "25px"
      }}>
        {topPicks.map((p, i) => (
          <div key={i} style={{
            background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
            padding: "15px",
            borderRadius: "14px",
            transition: "0.2s",
            transform: "scale(1)",
            cursor: "pointer",
            boxShadow: "0 0 15px rgba(168,85,247,0.3)"
          }}
          onMouseEnter={(e:any)=> e.currentTarget.style.transform="scale(1.05)"}
          onMouseLeave={(e:any)=> e.currentTarget.style.transform="scale(1)"}
          >
            <div style={{
              filter: isPro ? "none" : "blur(8px)"
            }}>
              <div>{p.away} @ {p.home}</div>
              <div style={{ fontSize: "18px" }}>EV: {p.ev.toFixed(2)}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* GAMES */}
      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        padding: "15px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <h2>Markets</h2>

        <div style={{
          filter: isPro ? "none" : "blur(6px)"
        }}>
          {games.map((g) => {
            const prev = prevOdds[g.id];

            let color = "white";
            if (prev !== undefined) {
              if (g.odds > prev) color = "#ef4444";
              if (g.odds < prev) color = "#22c55e";
            }

            return (
              <div key={g.id} style={{
                padding: "12px",
                marginBottom: "10px",
                background: "#0a0a0a",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "0.2s",
                cursor: "pointer"
              }}
              onMouseEnter={(e:any)=> e.currentTarget.style.background="#111"}
              onMouseLeave={(e:any)=> e.currentTarget.style.background="#0a0a0a"}
              >
                <div>{g.away} @ {g.home}</div>

                <div style={{
                  color,
                  fontWeight: "bold"
                }}>
                  {g.odds}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}