"use client";

import { useEffect, useState } from "react";
import { isProUser, setProUser } from "../../lib/auth";
import LockedFeature from "../../components/LockedFeature";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("success")) {
      setProUser();
    }

    setIsPro(isProUser());

    setGames([
      {
        team: "Lakers vs Warriors",
        home: "Warriors",
        away: "Lakers",
        bestHome: { odds: -120, book: "DraftKings" },
        bestAway: { odds: +110, book: "FanDuel" },
        edge: "+4.2%",
        arb: "2.1%"
      },
      {
        team: "Celtics vs Heat",
        home: "Heat",
        away: "Celtics",
        bestHome: { odds: -115, book: "BetMGM" },
        bestAway: { odds: +105, book: "Caesars" },
        edge: "+3.5%",
        arb: "1.8%"
      }
    ]);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 className="title">🔥 KBETZ LIVE TERMINAL</h1>

      {/* 🔒 BUTTON (UNCHANGED — DO NOT TOUCH) */}
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

          {/* 🔥 PHASE 3 (Urgency — safe to include) */}
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

      <div style={{ display: "grid", gap: "15px", marginTop: "20px" }}>
        {games.map((g, i) => (
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

            {/* 🔥 STEP 2 — VALUE TEASERS */}
            {!isPro ? (
              <LockedFeature>
                <div style={{ marginTop: "10px" }}>
                  ⭐ EV Edge: +4%+ <br />
                  💰 Arbitrage: 1%+
                </div>
              </LockedFeature>
            ) : (
              <div className="highlight" style={{ marginTop: "10px" }}>
                ⭐ EV Edge: {g.edge} <br />
                💰 Arbitrage: {g.arb}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}