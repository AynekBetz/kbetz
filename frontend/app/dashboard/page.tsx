"use client";

import { useEffect, useState } from "react";
import { getMe, getOdds } from "../../lib/api";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [betSlip, setBetSlip] = useState<any[]>([]);
  const [stake, setStake] = useState(10);
  const [aiPicks, setAiPicks] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    getMe(token).then((data) => {
      if (data.user) setUser(data.user);
    });

    fetchOdds();
  }, []);

  async function fetchOdds() {
    const data = await getOdds();

    if (Array.isArray(data)) {
      setGames(data);
      generateAIPicks(data);
    }
  }

  function addToSlip(team: string, odds: string) {
    setBetSlip([...betSlip, { team, odds }]);
  }

  function removeBet(i: number) {
    setBetSlip(betSlip.filter((_, idx) => idx !== i));
  }

  function toDecimal(odds: number) {
    return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
  }

  function calcEV(odds: number, prob: number) {
    const dec = toDecimal(odds);
    return prob * dec - 1;
  }

  // 🧠 AI PICKS ENGINE
  function generateAIPicks(data: any[]) {
    let picks: any[] = [];

    data.forEach((game) => {
      const book = game.bookmakers?.[0];
      const market = book?.markets?.[0];

      if (!market) return;

      market.outcomes.forEach((o: any) => {
        const impliedProb =
          o.price > 0
            ? 100 / (o.price + 100)
            : Math.abs(o.price) / (Math.abs(o.price) + 100);

        const modelProb = impliedProb + 0.05;

        const ev = calcEV(o.price, modelProb);

        if (ev > 0.05) {
          picks.push({
            team: o.name,
            odds: o.price,
            confidence: Math.min((modelProb * 100).toFixed(0), 95),
            ev: ev.toFixed(2),
          });
        }
      });
    });

    picks.sort((a, b) => b.ev - a.ev);
    setAiPicks(picks.slice(0, 5));
  }

  const totalOdds = betSlip.reduce(
    (acc, bet) => acc * toDecimal(parseInt(bet.odds)),
    1
  );

  const payout = (stake * totalOdds).toFixed(2);

  if (!user) return <div style={{ color: "white" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", background: "#0b0b0f", color: "white", minHeight: "100vh" }}>
      
      {/* LEFT SIDE */}
      <div style={{ flex: 3, padding: "20px" }}>
        <h1 style={{ color: "#a78bfa" }}>KBETZ™</h1>
        <p>{user.email} • {user.plan.toUpperCase()}</p>

        {/* 🔥 AI PRO CARD */}
        <div style={{
          marginTop: "20px",
          background: "#111827",
          padding: "15px",
          borderRadius: "12px"
        }}>
          <h2 style={{ color: "#facc15" }}>🔥 AI PRO CARD</h2>

          {user.plan !== "pro" ? (
            <div style={{
              marginTop: "10px",
              padding: "20px",
              background: "#1f2937",
              borderRadius: "10px",
              textAlign: "center"
            }}>
              <p>🔒 Unlock AI Picks + EV Analysis</p>

              <button
                onClick={() =>
                  window.location.href =
                    `${process.env.NEXT_PUBLIC_API_URL}/api/checkout`
                }
                style={{
                  background: "#a78bfa",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Upgrade to Pro 🚀
              </button>
            </div>
          ) : (
            <>
              {aiPicks.map((pick, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px",
                  borderBottom: "1px solid #222"
                }}>
                  <div>
                    <div>{pick.team}</div>
                    <div style={{ fontSize: "12px" }}>EV: {pick.ev}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div>{pick.odds > 0 ? `+${pick.odds}` : pick.odds}</div>
                    <div style={{ color: "#22c55e" }}>
                      {pick.confidence}%
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      addToSlip(pick.team, pick.odds.toString())
                    }
                    style={{
                      background: "#22c55e",
                      border: "none",
                      padding: "6px",
                      borderRadius: "6px"
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* LIVE GAMES */}
        <div style={{
          marginTop: "20px",
          background: "#111827",
          borderRadius: "12px",
          padding: "15px"
        }}>
          <h2>Live Games</h2>

          {games.map((game: any, i) => {
            const outcomes = game.bookmakers?.[0]?.markets?.[0]?.outcomes;
            if (!outcomes) return null;

            return (
              <div key={i} style={{ padding: "12px", borderBottom: "1px solid #222" }}>
                <div>{game.away_team} vs {game.home_team}</div>

                <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                  {outcomes.map((o: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() =>
                        addToSlip(o.name, o.price.toString())
                      }
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

      {/* RIGHT SIDE */}
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

            <button style={{ background: "#22c55e", width: "100%" }}>
              Place Bet
            </button>
          </>
        )}
      </div>
    </div>
  );
}