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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [history, setHistory] = useState<any>({});
  const [selected, setSelected] = useState<any>(null);
  const [steam, setSteam] = useState<any>({});
  const [sharp, setSharp] = useState<any>({});
  const [alerts, setAlerts] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🔔 SOUND INIT
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
    const signals: any = {};

    Object.keys(hist).forEach((id) => {
      const h = hist[id];
      if (h.length < 4) return;

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

  // 📡 FETCH + SIMULATE MOVEMENT
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      const data = await res.json();

      // 🎲 SIMULATE MARKET MOVEMENT
      const simulated = data.games.map((g: any) => {
        const randomMove = Math.floor(Math.random() * 15) - 7;
        return {
          ...g,
          odds: g.odds + randomMove,
        };
      });

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
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // FAST updates
    return () => clearInterval(interval);
  }, []);

  const bestGame = games.find((g) => steam[g.id] || sharp[g.id]);

  return (
    <div style={{ padding: "25px", maxWidth: "1200px", margin: "0 auto" }}>

      <h1>💰 KBETZ EDGE TERMINAL</h1>

      {/* 🚨 ALERT BAR */}
      <div style={{
        margin: "15px 0",
        padding: "10px",
        background: "#111",
        border: "1px solid #333",
        borderRadius: "8px"
      }}>
        {alerts.length === 0 && <div>No live alerts</div>}
        {alerts.map((a, i) => (
          <div key={i} style={{ fontSize: "12px" }}>{a}</div>
        ))}
      </div>

      {/* 🏆 BEST EDGE */}
      {bestGame && (
        <div style={{
          background: "#1f2937",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "15px",
          border: "1px solid gold"
        }}>
          <h3>🏆 BEST EDGE</h3>
          <div>{bestGame.away} @ {bestGame.home}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>

        {/* 🎯 GAMES */}
        <div style={{ flex: 2 }}>
          {games.map((g) => {
            const isSteam = steam[g.id];
            const isSharp = sharp[g.id];
            const isHot = isSteam && isSharp;

            return (
              <div
                key={g.id}
                onClick={() => setSelected(g)}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  background: isHot
                    ? "#3f1d00"
                    : isSteam
                    ? "#2a0a0a"
                    : isSharp
                    ? "#0a2a0a"
                    : "#0a0a0a",
                  borderRadius: "10px",
                  border: isHot
                    ? "2px solid orange"
                    : isSteam
                    ? "1px solid red"
                    : isSharp
                    ? "1px solid #22c55e"
                    : "1px solid #222",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div>{g.away} @ {g.home}</div>

                    {isHot && (
                      <div style={{ color: "orange", fontSize: "12px" }}>
                        🔥 HOT GAME
                      </div>
                    )}

                    {isSteam && (
                      <div style={{ color: "red", fontSize: "12px" }}>
                        🚨 STEAM MOVE
                      </div>
                    )}

                    {isSharp && (
                      <div style={{ color: "#22c55e", fontSize: "12px" }}>
                        🟢 SHARP ({isSharp})
                      </div>
                    )}
                  </div>

                  <div>
                    {g.odds > 0 ? "+" : ""}
                    {g.odds}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 📊 CHART */}
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
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="odds"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}