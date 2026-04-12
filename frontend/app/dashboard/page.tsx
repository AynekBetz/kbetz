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

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      const data = await res.json();

      setGames(data.games || []);

      // build history
      setHistory((prev: any) => {
        const updated = { ...prev };

        data.games.forEach((g: any) => {
          if (!updated[g.id]) updated[g.id] = [];

          updated[g.id].push({
            time: new Date().toLocaleTimeString(),
            odds: g.odds,
          });

          // limit history length
          if (updated[g.id].length > 20) {
            updated[g.id].shift();
          }
        });

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
      
      <h1>📈 KBETZ LINE TERMINAL</h1>

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
                borderRadius: "10px",
                border: "1px solid #222",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{g.away} @ {g.home}</span>
                <span>{g.odds}</span>
              </div>

              <div style={{ fontSize: "12px", color: "#888" }}>
                EV: {g.ev}%
              </div>
            </div>
          ))}
        </div>

        {/* CHART PANEL */}
        <div
          style={{
            flex: 1,
            background: "#0a0a0a",
            borderRadius: "10px",
            padding: "15px",
            border: "1px solid #222",
            height: "400px"
          }}
        >
          <h2>📊 Line Movement</h2>

          {!selected && (
            <div style={{ color: "#666" }}>
              Click a game to view chart
            </div>
          )}

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