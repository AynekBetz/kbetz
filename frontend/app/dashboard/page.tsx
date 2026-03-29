"use client";

import { useEffect, useState } from "react";
import { getMe, getOdds } from "../../lib/api";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [betSlip, setBetSlip] = useState<any[]>([]);
  const [stake, setStake] = useState(10);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    getMe(token).then((data) => {
      if (data.user) setUser(data.user);
    });

    getOdds().then((data) => {
      if (Array.isArray(data)) setGames(data);
    });
  }, []);

  function addToSlip(team: string, odds: string) {
    setBetSlip([...betSlip, { team, odds }]);
  }

  function removeBet(i: number) {
    setBetSlip(betSlip.filter((_, idx) => idx !== i));
  }

  function toDecimal(odds: string) {
    const o = parseInt(odds);
    return o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o);
  }

  const totalOdds = betSlip.reduce((acc, bet) => acc * toDecimal(bet.odds), 1);
  const payout = (stake * totalOdds).toFixed(2);

  if (!user) return <div style={{ color: "white" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", background: "#0b0b0f", color: "white", minHeight: "100vh" }}>
      
      {/* LEFT */}
      <div style={{ flex: 3, padding: "20px" }}>
        <h1 style={{ color: "#a78bfa" }}>KBETZ™</h1>
        <p>{user.email} • {user.plan.toUpperCase()}</p>

        <div style={{ marginTop: "20px", background: "#111827", borderRadius: "12px", padding: "15px" }}>
          <h2>Live Games</h2>

          {games.map((game, i) => {
            const book = game.bookmakers?.[0];
            const market = book?.markets?.[0];
            const outcomes = market?.outcomes;

            if (!outcomes) return null;

            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #222" }}>
                <div>
                  <div>{game.away_team}</div>
                  <div>{game.home_team}</div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  {outcomes.map((o, idx) => (
                    <button
                      key={idx}
                      onClick={() => addToSlip(o.name, o.price.toString())}
                      style={{
                        padding: "8px",
                        background: "#1f2937",
                        borderRadius: "6px",
                        color: "#22c55e"
                      }}
                    >
                      {o.price > 0 ? `+${o.price}` : o.price}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, background: "#111827", padding: "20px" }}>
        <h2>Bet Slip</h2>

        {betSlip.map((bet, i) => (
          <div key={i} style={{ marginTop: "10px", background: "#1f2937", padding: "10px" }}>
            {bet.team} ({bet.odds})
            <button onClick={() => removeBet(i)}>X</button>
          </div>
        ))}

        {betSlip.length > 0 && (
          <>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
            />

            <p>Payout: ${payout}</p>

            <button style={{ background: "green", width: "100%" }}>
              Place Bet
            </button>
          </>
        )}
      </div>
    </div>
  );
}