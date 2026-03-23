"use client";

import { useEffect, useState } from "react";
import { getToken } from "../../utils/authStore";

export default function DashboardPage() {
  const [games, setGames] = useState<any[]>([]);
  const [betslip, setBetslip] = useState<any[]>([]);
  const [movement, setMovement] = useState<any>({});
  const [prevOdds, setPrevOdds] = useState<any>({});

  useEffect(() => {
    fetch("http://localhost:10000/odds")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);

        const initial: any = {};
        data.forEach((g: any) => {
          g.markets[0].outcomes.forEach((o: any) => {
            initial[o.name] = o.price;
          });
        });
        setPrevOdds(initial);
      });
  }, []);

  // 🔥 SIMULATED LINE MOVEMENT
  useEffect(() => {
    const interval = setInterval(() => {
      setGames((prevGames) =>
        prevGames.map((g) => ({
          ...g,
          markets: [
            {
              ...g.markets[0],
              outcomes: g.markets[0].outcomes.map((o: any) => {
                const change = Math.random() > 0.5 ? 1 : -1;
                const newPrice = o.price + change;

                const old = prevOdds[o.name] || o.price;
                const diff = newPrice - old;

                setMovement((prev: any) => ({
                  ...prev,
                  [o.name]: {
                    diff,
                    percent: ((diff / Math.abs(old)) * 100).toFixed(1),
                  },
                }));

                return { ...o, price: newPrice };
              }),
            },
          ],
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [prevOdds]);

  const addBet = async (team: string, odds: number) => {
    const token = getToken();

    if (!token) {
      alert("Login first");
      window.location.href = "/login";
      return;
    }

    const bet = { team, odds };

    await fetch("http://localhost:10000/bets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(bet),
    });

    setBetslip((prev) => [...prev, bet]);
  };

  const potential = betslip.length * 10;

  return (
    <div className="container">

      {/* MAIN */}
      <div className="main">
        <h1>KBETZ</h1>

        {games.map((g) => (
          <div key={g.id} className="game">

            <div className="game-header">
              {g.away_team} @ {g.home_team}
            </div>

            <div className="odds-row">
              {g.markets[0].outcomes.map((o: any) => {
                const move = movement[o.name];

                return (
                  <button
                    key={o.name}
                    className={`odds-btn ${
                      move?.diff > 0 ? "odds-up" : move?.diff < 0 ? "odds-down" : ""
                    }`}
                    onClick={() => addBet(o.name, o.price)}
                  >
                    <div>{o.name}</div>

                    <div className="odds-price">
                      {o.price > 0 ? "+" : ""}
                      {o.price}

                      {move && (
                        <span className="arrow">
                          {move.diff > 0 ? "↑" : "↓"}
                        </span>
                      )}
                    </div>

                    {move && (
                      <div style={{ fontSize: "10px", color: "#aaa" }}>
                        {move.percent}%
                      </div>
                    )}

                    {Math.random() > 0.7 && (
                      <div className="sharp">Sharp Money</div>
                    )}
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

        {betslip.length === 0 && (
          <p style={{ color: "#aaa" }}>Click odds to add bets</p>
        )}

        {betslip.map((b, i) => (
          <div key={i} className="bet">
            <div>{b.team}</div>
            <div className="odds-price">
              {b.odds > 0 ? "+" : ""}
              {b.odds}
            </div>
          </div>
        ))}

        {betslip.length > 0 && (
          <div style={{ marginTop: "10px", fontWeight: "bold" }}>
            Potential: ${potential}
          </div>
        )}
      </div>

    </div>
  );
}