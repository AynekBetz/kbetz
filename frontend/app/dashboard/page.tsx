"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [aiPick, setAiPick] = useState<any>(null);

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
  const generatePick = (games: any[], prevOdds: any) => {
    let best = null;

    games.forEach((g) => {
      const prob = impliedProb(g.odds);
      const prev = prevOdds[g.id];

      let momentum = 0;
      let reasons: string[] = [];

      if (prev !== undefined) {
        momentum = g.odds - prev;

        if (momentum < 0) {
          reasons.push("Line moving in favor");
        } else if (momentum > 0) {
          reasons.push("Market fading this side");
        }
      }

      // simulate sharper probability
      let trueProb = prob;

      if (momentum < 0) trueProb += 0.04;
      if (momentum > 0) trueProb -= 0.03;

      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      if (!best || ev > best.ev) {
        best = {
          ...g,
          ev,
          confidence:
            ev > 10 ? "ELITE" :
            ev > 6 ? "HIGH" :
            ev > 3 ? "MEDIUM" : "LOW",
          reasons,
        };
      }
    });

    setAiPick(best);
  };

  // ================= ALERT SOUND =================
  const playSound = () => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.play();
    } catch {}
  };

  // ================= FETCH GAMES =================
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

    generatePick(newGames, updatedPrev);
  };

  // ================= ALERT =================
  const createAlert = (text: string) => {
    const id = Date.now();

    setAlerts((prev) => [{ id, text }, ...prev].slice(0, 5));

    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 4000);
  };

  // ================= UPGRADE =================
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

      {/* 🧠 AI BET CARD */}
      {aiPick && (
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "20px"
        }}>
          <h2>🧠 AI BEST BET</h2>

          <div style={{
            marginTop: "10px",
            filter: isPro ? "none" : "blur(8px)"
          }}>
            {aiPick.away} @ {aiPick.home} ({aiPick.odds})

            <div>EV: {aiPick.ev.toFixed(2)}%</div>
            <div>Confidence: {aiPick.confidence}</div>

            <div style={{ marginTop: "10px" }}>
              {aiPick.reasons.map((r: string, i: number) => (
                <div key={i}>• {r}</div>
              ))}
            </div>
          </div>

          {!isPro && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}>
              🔒 PRO ONLY
              <button onClick={upgrade}>Unlock</button>
            </div>
          )}
        </div>
      )}

      {/* 🚨 ALERTS */}
      <div>
        {alerts.map((a) => (
          <div key={a.id}>{a.text}</div>
        ))}
      </div>

      {/* 📊 GAMES */}
      {games.map((g) => (
        <div key={g.id}>
          {g.away} @ {g.home} ({g.odds})
        </div>
      ))}
    </div>
  );
}