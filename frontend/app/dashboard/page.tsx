"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// convert American odds → decimal
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

  // add to bet slip
  const addToSlip = (game: any) => {
    const exists = betSlip.find((b) => b.id === game.id);
    if (exists) return;

    setBetSlip([...betSlip, game]);
  };

  // remove from slip
  const removeFromSlip = (id: string) => {
    setBetSlip(betSlip.filter((b) => b.id !== id));
  };

  // calculate payout
  const calculatePayout = () => {
    if (betSlip.length === 0) return 0;

    let total = 1;

    betSlip.forEach((b) => {
      total *= toDecimal(b.odds);
    });

    return (stake * total).toFixed(2);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1100px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        🔥 KBETZ LIVE DASHBOARD
      </h1>

      {/* AI PICK */}
      {aiPick && (
        <div
          style={{
            marginBottom: "25px",
            padding: "20px",
            background: "#4c1d95",
            borderRadius: "12px",
          }}
        >
          <h2>🧠 AI PICK</h2>
          <div>{aiPick.matchup}</div>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>
            {aiPick.odds > 0 ? "+" : ""}
            {aiPick.odds}
          </div>
          <div>EV: {aiPick.ev}%</div>
          <div>Confidence: {aiPick.confidence}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>

        {/* LEFT SIDE — GAMES */}
        <div style={{ flex: 2 }}>
          {games.map((g) => (
            <div
              key={g.id}
              onClick={() => addToSlip(g)}
              style={{
                padding: "15px",
                background: "#111",
                marginBottom: "12px",
                borderRadius: "10px",
                border: "1px solid #222",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {g.away} @ {g.home}
                </span>

                <span style={{ fontWeight: "bold" }}>
                  {g.odds > 0 ? "+" : ""}
                  {g.odds}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "#aaa" }}>
                EV: {g.ev}%
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT SIDE — BET SLIP */}
        <div
          style={{
            flex: 1,
            background: "#111",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid #222",
            height: "fit-content"
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>🧾 Bet Slip</h2>

          {betSlip.length === 0 && (
            <div style={{ color: "#777" }}>No bets selected</div>
          )}

          {betSlip.map((b) => (
            <div
              key={b.id}
              style={{
                marginBottom: "10px",
                paddingBottom: "10px",
                borderBottom: "1px solid #222"
              }}
            >
              <div>{b.away} @ {b.home}</div>
              <div>
                {b.odds > 0 ? "+" : ""}
                {b.odds}
              </div>

              <button
                onClick={() => removeFromSlip(b.id)}
                style={{
                  marginTop: "5px",
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 8px",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* STAKE */}
          {betSlip.length > 0 && (
            <>
              <div style={{ marginTop: "10px" }}>
                Stake:
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "5px",
                    marginTop: "5px",
                    background: "#000",
                    color: "#fff",
                    border: "1px solid #333"
                  }}
                />
              </div>

              {/* PAYOUT */}
              <div style={{ marginTop: "15px", fontWeight: "bold" }}>
                Payout: ${calculatePayout()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}