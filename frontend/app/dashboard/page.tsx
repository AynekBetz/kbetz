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
  const [audioReady, setAudioReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");

    const unlock = () => {
      audioRef.current?.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
        setAudioReady(true);
      }).catch(() => {});

      window.removeEventListener("click", unlock);
    };

    window.addEventListener("click", unlock);
  }, []);

  // 🚨 STEAM
  const detectSteam = (prev: any[], current: any[]) => {
    const alerts: any = {};

    current.forEach((g) => {
      const old = prev.find((p) => p.id === g.id);
      if (!old) return;

      if (Math.abs(g.odds - old.odds) >= 10) {
        alerts[g.id] = true;

        if (audioReady) {
          audioRef.current?.play().catch(() => {});
        }
      }
    });

    setSteam(alerts);
  };

  // 🧠 SHARP MONEY
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

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      const data = await res.json();

      detectSteam(games, data.games || []);

      setGames(data.games || []);

      setHistory((prev: any) => {
        const updated = { ...prev };

        data.games.forEach((g: any) => {
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      
      <h1>💰 KBETZ SMART TERMINAL</h1>

      <div style={{ display: "flex", gap: "20px" }}>

        {/* GAMES */}
        <div style={{ flex: 2 }}>
          {games.map((g) => {
            const isSteam = steam[g.id];
            const isSharp = sharp[g.id];

            return (
              <div
                key={g.id}
                onClick={() => setSelected(g)}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  background: isSteam
                    ? "#2a0a0a"
                    : isSharp
                    ? "#0a2a0a"
                    : "#0a0a0a",
                  borderRadius: "10px",
                  border: isSteam
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

                    {isSteam && (
                      <div style={{ color: "red", fontSize: "12px" }}>
                        🚨 STEAM MOVE
                      </div>
                    )}

                    {isSharp && (
                      <div style={{ color: "#22c55e", fontSize: "12px" }}>
                        🟢 SHARP MONEY ({isSharp})
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

        {/* CHART */}
        <div style={{
          flex: 1,
          background: "#0a0a0a",
          borderRadius: "10px",
          padding: "15px",
          border: "1px solid #222",
          height: "400px"
        }}>
          <h2>📊 Line Movement</h2>

          {!selected && <div>Click a game</div>}

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