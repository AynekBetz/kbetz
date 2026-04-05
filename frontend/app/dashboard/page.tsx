"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {

  // 🔒 STRIPE (UNCHANGED)
  const handleUpgrade = async () => {
    try {
      const res = await fetch(
        "http://localhost:10000/api/stripe/create-checkout-session",
        { method: "POST" }
      );

      const data = await res.json();

      if (data.url) window.location.href = data.url;
      else alert("Stripe failed");

    } catch {
      alert("Connection failed");
    }
  };

  const playSound = () => {
    const audio = new Audio("/alert.mp3");
    audio.play().catch(() => {});
  };

  const [games, setGames] = useState<any[]>([]);
  const [betSlip, setBetSlip] = useState<any[]>([]);
  const [stake, setStake] = useState(10);

  useEffect(() => {
    fetch("http://localhost:10000/api/odds")
      .then(res => res.json())
      .then(data => setGames(data));
  }, []);

  const addToSlip = (g: any) => {
    setBetSlip(prev => [...prev, g]);
    playSound();
  };

  const calculatePayout = () => {
    let total = 1;

    betSlip.forEach(b => {
      total *= b.odds > 0
        ? (b.odds / 100 + 1)
        : (100 / Math.abs(b.odds) + 1);
    });

    return (stake * total).toFixed(2);
  };

  return (
    <div style={{ background: "#020202", color: "white", minHeight: "100vh", padding: 20 }}>

      <h1>📊 KBETZ LIVE TERMINAL</h1>

      {/* 🧠 EV LEADERBOARD */}
      <div style={{ border: "1px solid #00ffcc", padding: 15, marginBottom: 20 }}>
        <h3 style={{ color: "#00ffcc" }}>🧠 TOP EV PLAYS</h3>

        {[...games]
          .sort((a, b) => parseFloat(b.ev) - parseFloat(a.ev))
          .slice(0, 5)
          .map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{g.team}</span>
              <span style={{ color: "#00ffcc" }}>{g.ev}%</span>
            </div>
          ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* 🔥 LIVE MARKET */}
        <div>

          {[...games]
            .sort((a, b) => parseFloat(b.ev) - parseFloat(a.ev))
            .map(g => {

              const ev = parseFloat(g.ev);

              return (
                <div key={g.id}
                  onClick={() => addToSlip(g)}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    cursor: "pointer",
                    background:
                      g.arbitrage ? "#001a33" :
                      ev > 2 ? "#003322" :
                      ev > 0 ? "#001a1a" :
                      "#0a0a0a"
                  }}
                >

                  <div>{g.team}</div>

                  <div style={{ fontSize: 12 }}>
                    EV: {g.ev}%
                  </div>

                  {g.arbitrage && <div style={{ color: "#00aaff" }}>🔵 Arbitrage</div>}
                  {g.steamMove && <div style={{ color: "#ffcc00" }}>⚡ Steam Move</div>}

                  {/* 📈 LINE CHART */}
                  <div style={{ display: "flex", gap: 2 }}>
                    {g.history?.slice(-10).map((h, i) => (
                      <div key={i}
                        style={{
                          width: 4,
                          height: `${Math.abs(h.odds) / 2}px`,
                          background: "#00ffcc"
                        }}
                      />
                    ))}
                  </div>

                  <div style={{
                    color: g.odds > 0 ? "#00ffcc" : "#ff4d4d",
                    fontWeight: "bold"
                  }}>
                    {g.odds > 0 ? `+${g.odds}` : g.odds}
                  </div>

                </div>
              );
            })}

        </div>

        {/* 💰 BET SLIP */}
        <div>

          <h2>Bet Slip</h2>

          {betSlip.map((b, i) => (
            <div key={i}>{b.team}</div>
          ))}

          <div>
            Stake:
            <input value={stake} onChange={(e) => setStake(Number(e.target.value))} />
          </div>

          <div>Payout: ${calculatePayout()}</div>

        </div>

      </div>

      {/* 🔒 PRO */}
      <div style={{ marginTop: 20 }}>
        <button onClick={handleUpgrade}>Upgrade to PRO</button>
      </div>

    </div>
  );
}