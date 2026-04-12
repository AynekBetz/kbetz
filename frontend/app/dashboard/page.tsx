"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function toDecimal(odds: number) {
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
}

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevGames, setPrevGames] = useState<any[]>([]);
  const [betSlip, setBetSlip] = useState<any[]>([]);
  const [stake, setStake] = useState(10);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      const data = await res.json();

      detectChanges(prevGames, data.games || []);
      setPrevGames(games);
      setGames(data.games || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 60s
    return () => clearInterval(interval);
  }, []);

  // detect odds movement
  const detectChanges = (oldGames: any[], newGames: any[]) => {
    newGames.forEach((newG) => {
      const old = oldGames.find((g) => g.id === newG.id);
      if (!old) return;

      if (old.odds !== newG.odds) {
        // play sound
        audioRef.current?.play().catch(() => {});
      }
    });
  };

  const addToSlip = (g: any) => {
    if (betSlip.find((b) => b.id === g.id)) return;
    setBetSlip([...betSlip, g]);
  };

  const payout = () => {
    let total = 1;
    betSlip.forEach((b) => (total *= toDecimal(b.odds)));
    return (stake * total).toFixed(2);
  };

  // determine color flash
  const getFlashColor = (g: any) => {
    const prev = prevGames.find((p) => p.id === g.id);
    if (!prev) return "";

    if (g.odds > prev.odds) return "#16a34a"; // green
    if (g.odds < prev.odds) return "#dc2626"; // red
    return "";
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>🔥 KBETZ LIVE TERMINAL</h1>

      <div style={{ display: "flex", gap: "20px" }}>

        {/* GAMES */}
        <div style={{ flex: 2 }}>
          {games.map((g) => {
            const flash = getFlashColor(g);

            return (
              <div
                key={g.id}
                onClick={() => addToSlip(g)}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                  background: "#0a0a0a",
                  border: `1px solid ${flash || "#222"}`,
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{g.away} @ {g.home}</span>

                  <span style={{
                    fontWeight: "bold",
                    color: flash || "#fff"
                  }}>
                    {g.odds > 0 ? "+" : ""}{g.odds}
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "#888" }}>
                  EV: {g.ev}%
                </div>
              </div>
            );
          })}
        </div>

        {/* BET SLIP */}
        <div style={{
          flex: 1,
          background: "#0a0a0a",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #222"
        }}>
          <h2>🧾 Bet Slip</h2>

          {betSlip.map((b) => (
            <div key={b.id}>
              {b.away} @ {b.home}
              <div>{b.odds}</div>
            </div>
          ))}

          {betSlip.length > 0 && (
            <>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                style={{ width: "100%", marginTop: "10px" }}
              />

              <div style={{ marginTop: "10px" }}>
                ${payout()}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}