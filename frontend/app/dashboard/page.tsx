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

// 🔥 FORCE LIVE BACKEND (NO ENV ISSUES)
const API_URL = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [history, setHistory] = useState<any>({});
  const [selected, setSelected] = useState<any>(null);
  const [steam, setSteam] = useState<any>({});
  const [sharp, setSharp] = useState<any>({});
  const [alerts, setAlerts] = useState<string[]>([]);
  const [error, setError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");

    const unlock = () => {
      audioRef.current?.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
      }).catch(() => {});
      window.removeEventListener("click", unlock);
    };

    window.addEventListener("click", unlock);
  }, []);

  // 🚨 STEAM DETECTION
  const detectSteam = (prev: any[], current: any[]) => {
    if (!prev || !current) return;

    const s: any = {};
    const newAlerts: string[] = [];

    current.forEach((g) => {
      const old = prev.find((p) => p.id === g.id);
      if (!old) return;

      const diff = Math.abs(g.odds - old.odds);

      if (diff >= 10) {
        s[g.id] = true;
        newAlerts.push(`🚨 STEAM: ${g.away} @ ${g.home}`);
        audioRef.current?.play().catch(() => {});
      }
    });

    if (newAlerts.length) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 5));
    }

    setSteam(s);
  };

  // 🧠 SHARP DETECTION
  const detectSharp = (hist: any) => {
    if (!hist) return;

    const signals: any = {};

    Object.keys(hist).forEach((id) => {
      const h = hist[id];
      if (!h || h.length < 4) return;

      let up = 0;
      let down = 0;

      for (let i = 1; i < h.length; i++) {
        if (h[i].odds > h[i - 1].odds) up++;
        if (h[i].odds < h[i - 1].odds) down++;
      }

      if (up >= 3) signals[id] = "up";
      if (down >= 3) signals[id] = "down";
    });

    setSharp(signals);
  };

  // 📡 FETCH LIVE DATA
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);

      if (!res.ok) throw new Error("API failed");

      const data = await res.json();

      const baseGames = Array.isArray(data?.games)
        ? data.games
        : [];

      // simulate movement for now
      const simulated = baseGames.map((g: any, i: number) => ({
        id: g?.id ?? i,
        away: g?.away ?? "Team A",
        home: g?.home ?? "Team B",
        odds: (g?.odds ?? -110) + (Math.floor(Math.random() * 15) - 7),
      }));

      detectSteam(games, simulated);
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

        detectSharp(updated);

        return updated;
      });

      setError(false);
    } catch (err) {
      console.log("API ERROR:", err);

      setError(true);

      // fallback (never crash)
      const fallback = [
        { id: 1, away: "Warriors", home: "Lakers", odds: -110 },
        { id: 2, away: "Heat", home: "Celtics", odds: -130 },
      ];

      setGames(fallback);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const bestGame = games.find((g) => steam[g.id] || sharp[g.id]);

  return (
    <div style={{ padding: "25px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💰 KBETZ EDGE TERMINAL</h1>

      {/* ERROR */}
      {error && (
        <div style={{
          padding: "10px",
          background: "#2a0a0a",
          border: "1px solid red",
          marginBottom: "10px"
        }}>
          ⚠️ API offline — using fallback data
        </div>
      )}

      {/* ALERTS */}
      <div style={{
        padding: "10px",
        background: "#111",
        borderRadius: "8px",
        marginBottom: "15px"
      }}>
        {alerts.length === 0
          ? "No live alerts"
          : alerts.map((a, i) => <div key={i}>{a}</div>)}
      </div>

      {/* BEST EDGE */}
      {bestGame && (
        <div style={{
          border: "1px solid gold",
          padding: "10px",
          marginBottom: "10px"
        }}>
          🏆 BEST EDGE: {bestGame.away} @ {bestGame.home}
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>

        {/* GAMES */}
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
                <div>
                  {g.away} @ {g.home}
                </div>
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