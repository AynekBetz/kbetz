"use client";

import { useEffect, useState } from "react";

export default function ArbitragePage() {
  const [games, setGames] = useState<any[]>([]);
  const [profit, setProfit] = useState(0);

  const playAlert = () => {
    const audio = new Audio("/alert.mp3");
    audio.play().catch(() => {});
  };

  const loadOdds = async () => {
    const res = await fetch("http://localhost:10000/api/odds");
    const data = await res.json();

    const arbGames = data.filter((g: any) => g.arbitrage);

    if (arbGames.length > 0) playAlert();

    setGames(data);
  };

  useEffect(() => {
    loadOdds();
    const interval = setInterval(loadOdds, 5000);
    return () => clearInterval(interval);
  }, []);

  const arbGames = games.filter(g => g.arbitrage);

  const placeArb = (g: any) => {
    if (!g.arbSizing) return;

    const newProfit = parseFloat(g.arbSizing.profit);
    setProfit(prev => prev + newProfit);

    alert(`Arbitrage placed\nProfit: $${g.arbSizing.profit}`);
  };

  return (
    <div style={{
      background: "#020202",
      color: "white",
      minHeight: "100vh",
      padding: "20px"
    }}>

      <h1 style={{ color: "#00aaff" }}>🔵 ARBITRAGE FINDER</h1>

      <div style={{
        marginBottom: "20px",
        border: "1px solid #00ffcc",
        padding: "10px"
      }}>
        Total Profit: ${profit.toFixed(2)}
      </div>

      {arbGames.length === 0 && <p>No arbitrage opportunities</p>}

      {arbGames.map(g => (
        <div key={g.id} style={{
          padding: "15px",
          marginBottom: "12px",
          border: "1px solid #00aaff",
          background: "#001a33"
        }}>

          <div>{g.team}</div>

          <div>{g.home} → {g.bestHome.odds} ({g.bestHome.book})</div>
          <div>{g.away} → {g.bestAway.odds} ({g.bestAway.book})</div>

          {g.arbSizing && (
            <div style={{ color: "#00ffcc", marginTop: "8px" }}>
              Bet ${g.arbSizing.stake1} / ${g.arbSizing.stake2}
              <br />
              Profit: ${g.arbSizing.profit}
            </div>
          )}

          <button onClick={() => placeArb(g)} style={{
            marginTop: "10px",
            background: "#00aaff",
            padding: "8px",
            cursor: "pointer"
          }}>
            Place Arbitrage
          </button>

        </div>
      ))}

    </div>
  );
}