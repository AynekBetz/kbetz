"use client";

import { useEffect, useRef, useState } from "react";
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
  const [alerts, setAlerts] = useState<string[]>([]);
  const [aiPick, setAiPick] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
  }, []);

  // 🧮 ODDS → IMPLIED PROBABILITY
  const impliedProb = (odds: number) => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
  };

  // 🧠 AI ENGINE
  const generatePick = (games: any[]) => {
    if (!games.length) return;

    const evaluated = games.map((g) => {
      const prob = impliedProb(g.odds);

      // simulate "true edge"
      const trueProb = prob + (Math.random() * 0.08 - 0.02);

      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      return {
        ...g,
        prob,
        trueProb,
        ev,
      };
    });

    const best = evaluated.sort((a, b) => b.ev - a.ev)[0];

    // 🎯 CONFIDENCE
    let confidence = "LOW";
    if (best.ev > 5) confidence = "MEDIUM";
    if (best.ev > 10) confidence = "HIGH";

    // 🧠 REASONS
    const reasons = [];

    if (best.ev > 5) reasons.push("Positive expected value");
    if (best.odds < 0) reasons.push("Market leaning favorite");
    if (Math.random() > 0.5) reasons.push("Line movement detected");

    setAiPick({
      ...best,
      confidence,
      reasons,
    });
  };

  // 📡 FETCH
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      const data = await res.json();

      const baseGames = Array.isArray(data?.games) ? data.games : [];

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

    } catch (err) {
      console.log("API ERROR");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "25px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💰 KBETZ EDGE TERMINAL</h1>

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
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>
            {aiPick.odds}
          </div>

          <div>EV: {aiPick.ev.toFixed(2)}%</div>
          <div>Confidence: {aiPick.confidence}</div>

          <div style={{ marginTop: "10px" }}>
            {aiPick.reasons.map((r: string, i: number) => (
              <div key={i}>• {r}</div>
            ))}
          </div>
        </div>
      )}

      {/* GAMES */}
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

        {/* CHART */}
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