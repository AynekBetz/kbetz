"use client";

import { useEffect, useState } from "react";
import { getMe, getOdds } from "../../lib/api";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
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

    fetchOdds();
    const interval = setInterval(fetchOdds, 8000);

    return () => clearInterval(interval);
  }, []);

  async function fetchOdds() {
    const data = await getOdds();

    if (Array.isArray(data)) {
      const newMap: any = {};

      data.forEach((game: any) => {
        const outcomes =
          game.bookmakers?.[0]?.markets?.[0]?.outcomes || [];

        outcomes.forEach((o: any) => {
          newMap[`${game.id}-${o.name}`] = o.price;
        });
      });

      setPrevOdds((old: any) => {
        const updated = { ...old };

        Object.keys(newMap).forEach((key) => {
          if (old[key] && newMap[key] !== old[key]) {
            playSound();
          }
          updated[key] = newMap[key];
        });

        return updated;
      });

      setGames(data);
    }
  }

  function playSound() {
    const audio = new Audio(
      "https://www.soundjay.com/buttons/sounds/button-16.mp3"
    );
    audio.play();
  }

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

  const totalOdds = betSlip.reduce(
    (acc, bet) => acc * toDecimal(bet.odds),
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

        <div style={{ marginTop: "20px", background: "#111827", borderRadius: "12px", padding: "15px" }}>
          <h2>Live Games</h2>

          {games.map((game: any, i) => {
            const outcomes = game.bookmakers?.[0]?.markets?.[0]?.outcomes;
            if (!outcomes) return null;

            return (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px",
                borderBottom: "1px solid #222"
              }}>
                <div>
                  <div>{game.away_team}</div>
                  <div>{game.home_team}</div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  {outcomes.map((o: any, idx: number) => {
                    const key = `${game.id}-${o.name}`;
                    const prev = prevOdds[key];
                    const current = o.price;

                    let flashColor = "#1f2937";
                    let arrow = "";
                    let percent = "";

                    if (prev && current !== prev) {
                      const diff = current - prev;
                      const pct = ((diff / Math.abs(prev)) * 100).toFixed(1);

                      percent = `${pct}%`;

                      if (diff > 0) {
                        flashColor = "#065f46"; // green
                        arrow = "↑";
                      } else {
                        flashColor = "#7f1d1d"; // red
                        arrow = "↓";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => addToSlip(o.name, current.toString())}
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          background: flashColor,
                          color: "#22c55e",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: "60px",
                          transition: "0.3s"
                        }}
                      >
                        <span>
                          {current > 0 ? `+${current}` : current}
                        </span>

                        {arrow && (
                          <span style={{ fontSize: "10px" }}>
                            {arrow} {percent}
                          </span>
                        )}
                      </button>
                    );
                  })}
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