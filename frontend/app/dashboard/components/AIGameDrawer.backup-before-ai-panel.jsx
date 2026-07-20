"use client";

export default function AIGameDrawer({
  activeGame,
  onClose,
}) {
  if (!activeGame) return null;

  const confidence = Math.min(
    99,
    Math.max(
      55,
      Math.round(55 + Number(activeGame.edge || 0) * 5)
    )
  );

  const ev = Number(activeGame.edge || 0).toFixed(2);

  const books = activeGame.books
    ?.map((b) => b.name)
    .join(", ") || "DraftKings, FanDuel, BetMGM";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        maxWidth: "100%",
        height: "100vh",
        overflowY: "auto",
        background: "#071017",
        borderLeft: "1px solid rgba(0,255,225,.25)",
        boxShadow: "-10px 0 35px rgba(0,0,0,.45)",
        padding: 26,
        zIndex: 9999,
      }}
    >
      <button
        onClick={onClose}
        style={{
          float: "right",
          fontSize: 26,
          border: "none",
          background: "transparent",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <h2 style={{ color: "#00ffe1" }}>
        {activeGame.away} @ {activeGame.home}
      </h2>

      <hr />

      <h3>💰 Best Moneyline</h3>

      <p>{activeGame.home}: {activeGame.homeOdds}</p>

      <h3>📊 AI Edge</h3>

      <p>{ev}%</p>

      <h3>🤖 Confidence</h3>

      <p>{confidence}%</p>

      <h3>📚 Sportsbooks</h3>

      <p>{books}</p>

      <h3>📈 Market Movement</h3>

      <p>{activeGame.movement}</p>

      <h3>🧠 Why AI Likes It</h3>

      <ul>
        <li>Positive expected value</li>
        <li>Best available market price</li>
        <li>Line movement favors this side</li>
        <li>Multiple sportsbooks available</li>
      </ul>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 30,
        }}
      >
        <button>Add To Parlay</button>

        <button>⭐ Track Game</button>

        <button>📤 Share Pick</button>
      </div>
    </div>
  );
}
