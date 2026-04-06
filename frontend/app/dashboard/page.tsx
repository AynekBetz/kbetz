"use client";

import { useEffect, useState } from "react";
import { isProUser, setProUser } from "../../lib/auth";
import LockedFeature from "../../components/LockedFeature";
import { calculateEV, checkArbitrage } from "../../utils/calculations";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("success")) {
      setProUser();
    }

    setIsPro(isProUser());

    // 🔥 LIVE-LIKE DATA (used for calculations)
    setGames([
      {
        team: "Lakers vs Warriors",
        home: "Warriors",
        away: "Lakers",
        bestHome: { odds: -120, book: "DraftKings" },
        bestAway: { odds: +110, book: "FanDuel" }
      },
      {
        team: "Celtics vs Heat",
        home: "Heat",
        away: "Celtics",
        bestHome: { odds: -115, book: "BetMGM" },
        bestAway: { odds: +105, book: "Caesars" }
      }
    ]);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 className="title">🔥 KBETZ LIVE TERMINAL</h1>

      {/* 🔒 BUTTON (DO NOT TOUCH) */}
      {!isPro && (
        <>
          <button
            onClick={() => {
              window.location.href = "/api/checkout";
            }}
            className="pro-btn"
          >
            Upgrade to PRO
          </button>

          <div style={{ color: "#888", marginTop: "8px", fontSize: "13px" }}>
            Limited-time pricing — lock in $19.99/month
          </div>
        </>
      )}

      {isPro && (
        <div className="highlight" style={{ marginBottom: "20px" }}>
          ✅ PRO ACTIVE
        </div>
      )}

      {/* 🔥 GAME GRID */}
      <div style={{ display: "grid", gap: "15px", marginTop: "20px" }}>
        {games.map((g, i) => {
          const ev = calculateEV(g.bestAway.odds);
          const arb = checkArbitrage(g.bestHome.odds, g.bestAway.odds);

          return (
            <div key={i} className="card">
              <h3 style={{ marginBottom: "10px" }}>{g.team}</h3>

              {/* FREE DATA */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{g.away}</span>
                <span className="highlight">
                  {g.bestAway.odds} ({g.bestAway.book})
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{g.home}</span>
                <span className="highlight">
                  {g.bestHome.odds} ({g.bestHome.book})
                </span>
              </div>

              {/* 🔥 VALUE LAYER */}
              {!isPro ? (
                <LockedFeature>
                  <div style={{ marginTop: "10px" }}>
                    ⭐ EV Edge: +3%+ <br />
                    💰 Arbitrage: 1%+
                  </div>
                </LockedFeature>
              ) : (
                <div className="highlight" style={{ marginTop: "10px" }}>
                  ⭐ EV Edge: {ev}% <br />
                  💰 Arbitrage: {arb ? arb + "%" : "None"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}