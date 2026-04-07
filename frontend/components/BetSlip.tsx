"use client";

export default function BetSlip({ slip, removePick }: any) {
  return (
    <div
      style={{
        width: "300px",
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
    </div>
  );
}
