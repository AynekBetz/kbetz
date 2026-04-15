"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [topPicks, setTopPicks] = useState<any[]>([]);
  const [parlayPick, setParlayPick] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchGames();
    fetchUser();

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
  const generateAI = (games: any[], prevOdds: any) => {
    const evaluated = games.map((g) => {
      const prob = impliedProb(g.odds);
      const prev = prevOdds[g.id];

      let momentum = 0;
      let reasons: string[] = [];

      if (prev !== undefined) {
        momentum = g.odds - prev;

        if (momentum < 0) reasons.push("Line moving in favor");
        if (momentum > 0) reasons.push("Market fading this side");
      }

      let trueProb = prob;

      if (momentum < 0) trueProb += 0.04;
      if (momentum > 0) trueProb -= 0.03;

      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      return {
        ...g,
        ev,
        confidence:
          ev > 10 ? "ELITE" :
          ev > 6 ? "HIGH" :
          ev > 3 ? "MEDIUM" : "LOW",
        reasons,
      };
    });

    // 🧠 TOP 3 PICKS
    const sorted = evaluated.sort((a, b) => b.ev - a.ev);
    setTopPicks(sorted.slice(0, 3));

    // 🎯 PARLAY AI (top 2 combined)
    if (sorted.length >= 2) {
      const p1 = sorted[0];
      const p2 = sorted[1];

      const decimal1 = p1.odds < 0
        ? 1 + 100 / Math.abs(p1.odds)
        : 1 + p1.odds / 100;

      const decimal2 = p2.odds < 0
        ? 1 + 100 / Math.abs(p2.odds)
        : 1 + p2.odds / 100;

      const combinedOdds = ((decimal1 * decimal2) - 1) * 100;

      setParlayPick({
        legs: [p1, p2],
        odds: combinedOdds.toFixed(2),
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

    const newGames = data.games || [];
    const updatedPrev = { ...prevOdds };

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
      padding: "20px"
    }}>
      <h1 style={{
        background: "linear-gradient(90deg, #a855f7, #22c55e)",
        WebkitBackgroundClip: "text",
        color: "transparent"
      }}>
        KBETZ AI TERMINAL
      </h1>

      {/* 🧠 TOP PICKS */}
      <div style={{ marginBottom: "20px" }}>
        <h2>🧠 Top AI Picks</h2>

        <div style={{ filter: isPro ? "none" : "blur(8px)" }}>
          {topPicks.map((p, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              {p.away} @ {p.home} ({p.odds})  
              EV: {p.ev.toFixed(2)}%  
              Confidence: {p.confidence}

              <div>
                {p.reasons.map((r: string, idx: number) => (
                  <div key={idx}>• {r}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isPro && <button onClick={upgrade}>Unlock Picks</button>}
      </div>

      {/* 🎯 PARLAY AI */}
      {parlayPick && (
        <div style={{ marginBottom: "20px" }}>
          <h2>🎯 AI Parlay</h2>

          <div style={{ filter: isPro ? "none" : "blur(8px)" }}>
            {parlayPick.legs.map((l: any, i: number) => (
              <div key={i}>
                {l.away} @ {l.home}
              </div>
            ))}

            <div>Odds: +{parlayPick.odds}</div>
          </div>
        </div>
      )}

      {/* ALERTS */}
      {alerts.map((a) => (
        <div key={a.id}>{a.text}</div>
      ))}

      {/* GAMES */}
      {games.map((g) => (
        <div key={g.id}>
          {g.away} @ {g.home} ({g.odds})
        </div>
      ))}
    </div>
  );
}