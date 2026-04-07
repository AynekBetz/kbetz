"use client";

import { useState } from "react";

// Convert American odds to decimal
function toDecimal(odds: number) {
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
}

// Convert decimal to American odds
function toAmerican(decimal: number) {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (decimal - 1))}`;
  }
}

export default function BetSlip({ slip, removePick }: any) {
  const [stake, setStake] = useState(10);

  // 🔥 Calculate parlay odds
  const totalDecimal = slip.reduce((acc: number, pick: any) => {
    return acc * toDecimal(pick.odds);
  }, 1);

  const totalAmerican = toAmerican(totalDecimal);
  const payout = (stake * totalDecimal).toFixed(2);

  return (
    <div
      style={{
        width: "320px",
        background: "#0a0a0a",
        borderLeft: "1px solid #00ffc3",
        padding: "15px",
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh"
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>🧾 Bet Slip</h2>

      {slip.length === 0 && (
        <div style={{ color: "#888" }}>No bets selected</div>
      )}

      {slip.map((pick: any, i: number) => (
        <div
          key={i}
          style={{
            border: "1px solid #00ffc3",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px"
          }}
        >
          <div>{pick.team}</div>
          <div style={{ color: "#00ffc3" }}>
            {pick.odds} ({pick.book})
          </div>

          <button
            onClick={() => removePick(i)}
            style={{
              marginTop: "5px",
              background: "#ff4d4d",
              border: "none",
              padding: "5px",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Remove
          </button>
        </div>
      ))}

      {/* 🔥 STAKE INPUT */}
      {slip.length > 0 && (
        <>
          <div style={{ marginTop: "15px" }}>
            <div>Stake ($)</div>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                borderRadius: "6px",
                border: "1px solid #00ffc3",
                background: "#000",
                color: "#fff"
              }}
            />
          </div>

          {/* 🔥 PARLAY INFO */}
          <div style={{ marginTop: "15px", color: "#00ffc3" }}>
            <div>Parlay Odds: {totalAmerican}</div>
            <div>Total Payout: ${payout}</div>
          </div>
        </>
      )}
    </div>
  );
}