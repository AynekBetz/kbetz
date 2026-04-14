"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [history, setHistory] = useState<any>({});
  const [selected, setSelected] = useState<any>(null);
  const [aiPick, setAiPick] = useState<any>(null);
  const [error, setError] = useState(false);

  // 📊 implied probability
  const impliedProb = (odds: number) => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
  };

  // 🧠 SMART AI ENGINE
  const generatePick = (games: any[], history: any) => {
    if (!games.length) return;

    const evaluated = games.map((g) => {
      const prob = impliedProb(g.odds);

      const gameHistory = history[g.id] || [];

      let momentum = 0;
      let steam = false;

      if (gameHistory.length >= 2) {
        const first = gameHistory[0].odds;
        const last = gameHistory[gameHistory.length - 1].odds;

        momentum = last - first;

        if (Math.abs(momentum) >= 10) {
          steam = true;
        }
      }

      // 🧠 TRUE PROBABILITY ADJUSTMENT
      let trueProb = prob;

      // steam boost
      if (steam) trueProb += 0.05;

      // favorable movement (toward favorite)
      if (momentum < 0) trueProb += 0.03;

      // bad movement (against)
      if (momentum > 0) trueProb -= 0.03;

      // 💰 EV CALCULATION
      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      return {
        ...g,
        ev,
        momentum,
        steam,
      };
    });

    const best = evaluated.sort((a, b) => b.ev - a.ev)[0];

    // 🎯 CONFIDENCE SYSTEM
    let confidence = "LOW";

    if (best.ev > 3) confidence = "MEDIUM";
    if (best.ev > 7) confidence = "HIGH";
    if (best.ev > 12) confidence = "ELITE";

    // 🧠 REASONS ENGINE
    const reasons = [];

    if (best.ev > 5) reasons.push("Positive expected value");
    if (best.momentum < 0) reasons.push("Line moving in favor");
    if (best.momentum > 0) reasons.push("Market resistance");
    if (best.steam) reasons.push("Steam move detected");

    setAiPick({
      ...best,
      confidence,
      reasons,
    });
  };

  // 📡 FETCH
  const fetchData = async () => {
    let data;

    try {
      const res = await fetch(`${API_URL}/api/data`);

      if (!res.ok) throw new Error("bad");

      data = await res.json();
      setError(false);
    } catch {
      setError(true);

      data = {
        games: [
          { id: 1, away: "Warriors", home: "Lakers", odds: -110 },
          { id: 2, away: "Heat", home: "Celtics", odds: -130 },
        ],
      };
    }

    const baseGames = data.games || [];

    const simulated = baseGames.map((g: any, i: number) => ({
      id: g.id ?? i,
      away: g.away,
      home: g.home,
      odds: g.odds + (Math.floor(Math.random() * 10) - 5),
    }));

    setGames(simulated);

    setHistory((prev: any) => {
      const updated = { ...prev };

      simulated.forEach((g: any) => {
        if (!updated[g.id]) updated[g.id] = [];

        updated[g.id].push({
          time: new Date().toLocaleTimeString(),
          odds: g.odds,
        });

        if (updated[g.id].length > 25) updated[g.id].shift();
      });

      // 🔥 RUN AI WITH UPDATED HISTORY
      generatePick(simulated, updated);

      return updated;
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "25px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💰 KBETZ EDGE TERMINAL</h1>

      {error && (
        <div style={{
          background: "#2a0a0a",
          border: "1px solid red",
          padding: "10px",
          marginBottom: "10px"
        }}>
          ⚠️ API fallback active
        </div>
      )}

      {/* 🧠 AI PICK */}
      {aiPick && (
        <div style={{
          background: "#4c1d95",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px"
        }}>
          <h2>🧠 AI PICK</h2>

          <div>{aiPick.away} @ {aiPick.home}</div>
          <div style={{ fontSize: "22px" }}>{aiPick.odds}</div>

          <div>EV: {aiPick.ev.toFixed(2)}%</div>
          <div>Confidence: {aiPick.confidence}</div>

          <div style={{ marginTop: "10px" }}>
            {aiPick.reasons.map((r: string, i: number) => (
              <div key={i}>• {r}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 2 }}>
          {games.map((g) => (
            <div
              key={g.id}
              onClick={() => setSelected(g)}
              style={{
                padding: "15px",
                marginBottom: "10px",
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: "10px",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{g.away} @ {g.home}</div>
                <div>{g.odds}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          flex: 1,
          background: "#0a0a0a",
          borderRadius: "10px",
          padding: "15px",
          border: "1px solid #222",
          height: "400px"
        }}>
          <h2>📊 Movement</h2>

          {!selected && <div>Select a game</div>}

          {selected && history[selected.id] && (
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={history[selected.id]}>
                <XAxis dataKey="time" hide />
                <YAxis />
                <Tooltip />
                <Line dataKey="odds" stroke="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}