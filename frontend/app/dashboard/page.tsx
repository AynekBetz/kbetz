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

  // 🧮 implied probability
  const impliedProb = (odds: number) => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
  };

  // 🧠 AI PICK
  const generatePick = (games: any[]) => {
    if (!games.length) return;

    const evaluated = games.map((g) => {
      const prob = impliedProb(g.odds);
      const trueProb = prob + (Math.random() * 0.08 - 0.02);
      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      return { ...g, ev };
    });

    const best = evaluated.sort((a, b) => b.ev - a.ev)[0];

    let confidence = "LOW";
    if (best.ev > 5) confidence = "MEDIUM";
    if (best.ev > 10) confidence = "HIGH";

    setAiPick({
      ...best,
      confidence,
    });
  };

  // 📡 SAFE FETCH (KEY FIX)
  const fetchData = async () => {
    let data;

    try {
      const res = await fetch(`${API_URL}/api/data`);

      if (!res.ok) throw new Error("bad response");

      data = await res.json();

      setError(false);
    } catch (err) {
      console.log("FETCH FAILED — USING FALLBACK");

      setError(true);

      data = {
        games: [
          { id: 1, away: "Warriors", home: "Lakers", odds: -110 },
          { id: 2, away: "Heat", home: "Celtics", odds: -130 },
        ],
      };
    }

    const baseGames = Array.isArray(data?.games) ? data.games : [];

    // simulate movement
    const simulated = baseGames.map((g: any, i: number) => ({
      id: g?.id ?? i,
      away: g?.away ?? "Team A",
      home: g?.home ?? "Team B",
      odds: (g?.odds ?? -110) + (Math.floor(Math.random() * 10) - 5),
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

        if (updated[g.id].length > 20) updated[g.id].shift();
      });

      return updated;
    });

    generatePick(simulated);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "25px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💰 KBETZ EDGE TERMINAL</h1>

      {error && (
        <div style={{
          background: "#2a0a0a",
          padding: "10px",
          border: "1px solid red",
          marginBottom: "10px"
        }}>
          ⚠️ API offline — fallback
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
          <div style={{ fontSize: "20px" }}>{aiPick.odds}</div>
          <div>EV: {aiPick.ev.toFixed(2)}%</div>
          <div>Confidence: {aiPick.confidence}</div>
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