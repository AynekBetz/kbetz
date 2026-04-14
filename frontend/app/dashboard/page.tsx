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

// 🔒 TOGGLE THIS (simulate user)
const isPro = false;

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [history, setHistory] = useState<any>({});
  const [selected, setSelected] = useState<any>(null);
  const [aiPick, setAiPick] = useState<any>(null);
  const [error, setError] = useState(false);

  const impliedProb = (odds: number) => {
    if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
    return 100 / (odds + 100);
  };

  const generatePick = (games: any[], history: any) => {
    if (!games.length) return;

    const evaluated = games.map((g) => {
      const prob = impliedProb(g.odds);
      const hist = history[g.id] || [];

      let momentum = 0;
      if (hist.length >= 2) {
        momentum = hist[hist.length - 1].odds - hist[0].odds;
      }

      let trueProb = prob;

      if (momentum < 0) trueProb += 0.04;
      if (momentum > 0) trueProb -= 0.04;

      const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

      return { ...g, ev };
    });

    const best = evaluated.sort((a, b) => b.ev - a.ev)[0];

    setAiPick(best);
  };

  const fetchData = async () => {
    let data;

    try {
      const res = await fetch(`${API_URL}/api/data`);
      data = await res.json();
      setError(false);
    } catch {
      setError(true);
      data = {
        games: [
          { id: 1, away: "Warriors", home: "Lakers", odds: -110 },
        ],
      };
    }

    const realGames = data.games.map((g: any, i: number) => ({
      id: g.id ?? i,
      away: g.away,
      home: g.home,
      odds: g.odds,
    }));

    setGames(realGames);

    setHistory((prev: any) => {
      const updated = { ...prev };

      realGames.forEach((g: any) => {
        if (!updated[g.id]) updated[g.id] = [];

        updated[g.id].push({
          time: new Date().toLocaleTimeString(),
          odds: g.odds,
        });

        if (updated[g.id].length > 30) updated[g.id].shift();
      });

      generatePick(realGames, updated);

      return updated;
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "25px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💰 KBETZ EDGE TERMINAL</h1>

      {/* 🔒 PRO BANNER */}
      {!isPro && (
        <div style={{
          background: "#111",
          border: "1px solid gold",
          padding: "10px",
          marginBottom: "15px",
          textAlign: "center"
        }}>
          🔒 Upgrade to PRO to unlock AI picks & alerts
        </div>
      )}

      {/* 🧠 AI PICK */}
      {aiPick && (
        <div style={{
          background: "#4c1d95",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          position: "relative",
          filter: isPro ? "none" : "blur(6px)"
        }}>
          <h2>🧠 AI PICK</h2>

          <div>{aiPick.away} @ {aiPick.home}</div>
          <div style={{ fontSize: "22px" }}>{aiPick.odds}</div>

          <div>EV: {aiPick.ev?.toFixed(2)}%</div>

          {/* LOCK OVERLAY */}
          {!isPro && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "white",
              background: "rgba(0,0,0,0.6)"
            }}>
              🔒 PRO ONLY
            </div>
          )}
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

      {/* 💰 UPGRADE BUTTON */}
      {!isPro && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button style={{
            padding: "12px 20px",
            background: "gold",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}>
            Upgrade to PRO
          </button>
        </div>
      )}
    </div>
  );
}