"use client";

import { useEffect, useState } from "react";
import { getToken } from "../../utils/authStore";

export default function DashboardPage() {
  const [games, setGames] = useState<any[]>([]);
  const [betslip, setBetslip] = useState<any[]>([]);

  const token = getToken();

  useEffect(() => {
    fetch("http://localhost:10000/odds")
      .then((res) => res.json())
      .then((data) => setGames(data));
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

  const addBet = async (team: string, odds: number) => {
    if (!token) return;

    const bet = { team, odds };

    const res = await fetch("http://localhost:10000/bets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(bet),
    });

    const saved = await res.json();
    setBetslip((prev) => [...prev, saved]);
  };

  return (
    <div className="container">

      {/* MAIN */}
      <div className="main">
        <h1>📊 Dashboard</h1>

        {games.map((g) => (
          <div key={g.id} className="card">

            <div className="game-header">
              {g.away_team} @ {g.home_team}
            </div>

            <div className="odds-row">
              {g.markets[0].outcomes.map((o: any) => {
                const ev = calculateEV(o.price);
                const smart = ev > 0.05;

                return (
                  <button
                    key={o.name}
                    className={`odds-btn ${smart ? "smart" : ""}`}
                    onClick={() => addBet(o.name, o.price)}
                  >
                    <div>{o.name}</div>

                    <div className="odds-price">
                      {o.price > 0 ? "+" : ""}
                      {o.price}
                    </div>

                    <div className={ev > 0 ? "ev-good" : "ev-bad"}>
                      EV: {ev.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        ))}
      </div>

      {/* BET SLIP */}
      <div className="betslip">
        <h2>Bet Slip</h2>

        {betslip.map((b, i) => (
          <div key={i} className="bet">
            {b.team} ({b.odds})
          </div>
        ))}
      </div>

    </div>
  );
}