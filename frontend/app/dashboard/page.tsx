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
  const [audioReady, setAudioReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🔔 INIT AUDIO + UNLOCK ON CLICK
  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");

    const unlockAudio = () => {
      audioRef.current
        ?.play()
        .then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          setAudioReady(true);
          console.log("🔊 Audio unlocked");
        })
        .catch(() => {});

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
  }, []);

  // 🚨 STEAM DETECTION
  const detectSteam = (prev: any[], current: any[]) => {
    const alerts: any = {};

    current.forEach((g) => {
      const old = prev.find((p) => p.id === g.id);
      if (!old) return;

      const diff = Math.abs(g.odds - old.odds);

      if (diff >= 10) {
        alerts[g.id] = true;

        if (audioReady) {
          audioRef.current?.play().catch(() => {});
        }
      }
    });

    setSteam(alerts);
  };

  // 🔄 FETCH DATA
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      const data = await res.json();

      detectSteam(games, data.games || []);

      setGames(data.games || []);

      // 📊 BUILD HISTORY
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

        return updated;
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();

    // ⏱️ CHANGE TO 5000 FOR FAST TESTING
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        🚨 KBETZ STEAM TERMINAL
      </h1>

      {/* 🔔 TEST BUTTON */}
      <button
        onClick={() => audioRef.current?.play()}
        style={{
          marginBottom: "15px",
          padding: "8px",
          background: "#6d28d9",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        🔔 Test Sound
      </button>

      <div style={{ display: "flex", gap: "20px" }}>

        {/* LEFT — GAMES */}
        <div style={{ flex: 2 }}>
          {games.map((g) => {
            const isSteam = steam[g.id];

            return (
              <div
                key={g.id}
                onClick={() => setSelected(g)}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  background: isSteam ? "#2a0a0a" : "#0a0a0a",
                  borderRadius: "10px",
                  border: isSteam ? "1px solid red" : "1px solid #222",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div>{g.away} @ {g.home}</div>

                    <div style={{ fontSize: "12px", color: "#888" }}>
                      EV: {g.ev}%
                    </div>

                    {isSteam && (
                      <div style={{
                        color: "red",
                        fontSize: "12px",
                        marginTop: "5px"
                      }}>
                        🚨 STEAM MOVE
                      </div>
                    )}
                  </div>

                  <div style={{
                    fontWeight: "bold",
                    color: isSteam ? "red" : "#fff"
                  }}>
                    {g.odds > 0 ? "+" : ""}
                    {g.odds}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT — CHART */}
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