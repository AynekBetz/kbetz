"use client";

import { useEffect, useState } from "react";
import { isProUser, setProUser } from "../../lib/auth";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("success")) {
      setProUser();
    }

    setIsPro(isProUser());

    // TEMP DATA (so UI always shows something)
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
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "15px" }}>
        🔥 KBETZ LIVE TERMINAL
      </h1>

      {/* 🔥 STRIPE BUTTON (FINAL FIX) */}
      {!isPro && (
        <button
          onClick={() => {
            console.log("Redirecting to Stripe...");
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
            <h3 style={{ marginBottom: "8px" }}>{g.team}</h3>

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

            {isPro && (
              <div style={{ marginTop: "8px", color: "#00ffc3", fontSize: "14px" }}>
                ⭐ AI Edge: +4.2%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}