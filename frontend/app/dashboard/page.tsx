"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function toDecimal(odds: number) {
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
}

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [aiPick, setAiPick] = useState<any>(null);
  const [betSlip, setBetSlip] = useState<any[]>([]);
  const [stake, setStake] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data`);
        const data = await res.json();

        setGames(data.games || []);
        setAiPick(data.aiPick || null);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const addToSlip = (game: any) => {
    if (betSlip.find((b) => b.id === game.id)) return;
    setBetSlip([...betSlip, game]);
  };

  const removeFromSlip = (id: string) => {
    setBetSlip(betSlip.filter((b) => b.id !== id));
  };

  const payout = () => {
    if (!betSlip.length) return "0.00";
    let total = 1;
    betSlip.forEach((b) => (total *= toDecimal(b.odds)));
    return (stake * total).toFixed(2);
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <h1 style={{
        fontSize: "30px",
        marginBottom: "20px",
        letterSpacing: "1px"
      }}>
        🔥 KBETZ TERMINAL
      </h1>

      {/* AI PICK */}
      {aiPick && (
        <div style={{
          background: "linear-gradient(135deg, #4c1d95, #6d28d9)",
          padding: "20px",
          borderRadius: "14px",
          marginBottom: "20px",
          boxShadow: "0 0 25px rgba(139,92,246,0.3)"
        }}>
          <h2 style={{ marginBottom: "8px" }}>🧠 AI EDGE</h2>
          <div>{aiPick.matchup}</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {aiPick.odds > 0 ? "+" : ""}{aiPick.odds}
          </div>
          <div>EV: {aiPick.ev}%</div>
          <div style={{ opacity: 0.8 }}>Confidence: {aiPick.confidence}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>

        {/* LEFT — MARKET */}
        <div style={{ flex: 2 }}>
          {games.map((g) => (
            <div
              key={g.id}
              onClick={() => addToSlip(g)}
              style={{
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "12px",
                background: "#0a0a0a",
                border: "1px solid #1f1f1f",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget.style.background = "#141414");
                (e.currentTarget.style.border = "1px solid #6d28d9");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.background = "#0a0a0a");
                (e.currentTarget.style.border = "1px solid #1f1f1f");
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div>{g.away} @ {g.home}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    EV: {g.ev}%
                  </div>
                </div>

                <div style={{
                  fontWeight: "bold",
                  fontSize: "18px",
                  color: "#22c55e"
                }}>
                  {g.odds > 0 ? "+" : ""}{g.odds}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — BET SLIP */}
        <div style={{
          flex: 1,
          background: "#0a0a0a",
          border: "1px solid #1f1f1f",
          borderRadius: "14px",
          padding: "16px",
          position: "sticky",
          top: "20px"
        }}>
          <h2 style={{ marginBottom: "10px" }}>🧾 BET SLIP</h2>

          {betSlip.length === 0 && (
            <div style={{ color: "#666" }}>Select bets</div>
          )}

          {betSlip.map((b) => (
            <div key={b.id} style={{
              marginBottom: "10px",
              paddingBottom: "10px",
              borderBottom: "1px solid #222"
            }}>
              <div>{b.away} @ {b.home}</div>
              <div style={{ color: "#22c55e" }}>
                {b.odds > 0 ? "+" : ""}{b.odds}
              </div>

              <button onClick={() => removeFromSlip(b.id)} style={{
                marginTop: "5px",
                fontSize: "12px",
                background: "#dc2626",
                border: "none",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: "pointer"
              }}>
                remove
              </button>
            </div>
          ))}

          {betSlip.length > 0 && (
            <>
              <div style={{ marginTop: "10px" }}>
                Stake
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    padding: "8px",
                    background: "#000",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "6px"
                  }}
                />
              </div>

              <div style={{
                marginTop: "15px",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#22c55e"
              }}>
                ${payout()}
              </div>

              <button style={{
                width: "100%",
                marginTop: "10px",
                padding: "10px",
                background: "#6d28d9",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer"
              }}>
                PLACE BET
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}