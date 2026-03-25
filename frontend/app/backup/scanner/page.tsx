"use client";

import { useEffect, useState } from "react";

export default function ScannerPage() {
  const [games, setGames] = useState<any[]>([]);
  const [best, setBest] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:10000/odds")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);

        const picks: any[] = [];

        data.forEach((g: any) => {
          g.markets[0].outcomes.forEach((o: any) => {
            const ev = calculateEV(o.price);

            if (ev > 0.05) {
              picks.push({
                team: o.name,
                odds: o.price,
                ev,
              });
            }
          });
        });

        setBest(picks.sort((a, b) => b.ev - a.ev));
      });
  }, []);

  const impliedProb = (odds: number) => {
    if (odds > 0) return 100 / (odds + 100);
    return Math.abs(odds) / (Math.abs(odds) + 100);
  };

  const calculateEV = (odds: number) => {
    const prob = impliedProb(odds);
    const payout = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
    return prob * payout - (1 - prob);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🔍 EV Scanner</h1>

      {best.map((b, i) => (
        <div key={i} style={{
          background: "#111",
          padding: "10px",
          marginBottom: "8px",
          border: "1px solid #22c55e"
        }}>
          {b.team} ({b.odds}) | EV: {b.ev.toFixed(2)}
        </div>
      ))}
    </div>
  );
}