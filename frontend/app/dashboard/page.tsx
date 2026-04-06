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
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "15px" }}>
        🔥 KBETZ LIVE TERMINAL
      </h1>

      {/* 🔥 YOUR BUTTON (UNCHANGED) */}
      {!isPro && (
        <button
          onClick={() => {
            window.location.href = "/api/checkout";
          }}
          style={{
            background: "#00ffc3",
            color: "#000",
            padding: "12px 18px",
            borderRadius: "8px",
            fontWeight: "bold",
            marginBottom: "20px",
            cursor: "pointer"
          }}
        >
          Upgrade to PRO
        </button>
      )}

      {isPro && (
        <div style={{ color: "#00ffc3", marginBottom: "20px", fontWeight: "bold" }}>
          ✅ PRO ACTIVE
        </div>
      )}

      <div style={{ display: "grid", gap: "12px" }}>
        {games.map((g, i) => (
          <div key={i} style={{
            background: "#0a0a0a",
            border: "1px solid #00ffc3",
            borderRadius: "10px",
            padding: "15px"
          }}>
            <h3>{g.team}</h3>

            {/* FREE DATA */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{g.away}</span>
              <span style={{ color: "#00ffc3" }}>
                {g.bestAway.odds} ({g.bestAway.book})
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{g.home}</span>
              <span style={{ color: "#00ffc3" }}>
                {g.bestHome.odds} ({g.bestHome.book})
              </span>
            </div>

            {/* 🔒 LOCKED FEATURES */}
            {!isPro ? (
              <LockedFeature>
                <div style={{ marginTop: "10px" }}>
                  ⭐ EV Edge: {g.edge} <br />
                  💰 Arbitrage: {g.arb}
                </div>
              </LockedFeature>
            ) : (
              <div style={{ marginTop: "10px", color: "#00ffc3" }}>
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