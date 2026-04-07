"use client";

import { useEffect, useState, useRef } from "react";
import { isProUser, setProUser } from "../../lib/auth";
import LockedFeature from "../../components/LockedFeature";
import { calculateEV, checkArbitrage } from "../../utils/calculations";
import { fetchOdds } from "../../utils/oddsFetcher";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);

  const prevGamesRef = useRef<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("success")) {
      setProUser();
    }

    setIsPro(isProUser());

    audioRef.current = new Audio("/alert.mp3");

    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
          })
          .catch(() => {});
      }
      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);

    async function loadOdds() {
      const data = await fetchOdds();
      if (!Array.isArray(data)) return;

      const updated = data.map((game, index) => {
        const prev = prevGamesRef.current[index];

        let movement = null;

        if (prev) {
          if (game.bestAway.odds > prev.bestAway.odds) movement = "up";
          else if (game.bestAway.odds < prev.bestAway.odds) movement = "down";
        }

        return { ...game, movement };
      });

      const hasMovement = updated.some((g) => g.movement);
      if (hasMovement && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }

      prevGamesRef.current = updated;
      setGames(updated);
    }

    loadOdds();
    const interval = setInterval(loadOdds, 15000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 className="title">🔥 KBETZ LIVE TERMINAL</h1>

      {/* 🔒 BUTTON (UNCHANGED) */}
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

      <div style={{ display: "grid", gap: "15px", marginTop: "20px" }}>
        {games.map((g, i) => {
          const ev = calculateEV(g.bestAway.odds);
          const arb = checkArbitrage(g.bestHome.odds, g.bestAway.odds);

          const isArb = arb !== null;

          return (
            <div
              key={i}
              className="card"
              style={{
                border: isArb ? "1px solid #00bfff" : undefined,
                boxShadow: isArb
                  ? "0 0 15px rgba(0,191,255,0.6)"
                  : undefined
              }}
            >
              <h3>{g.team}</h3>

              {/* AWAY */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{g.away}</span>
                <span
                  style={{
                    color:
                      g.movement === "up"
                        ? "#00ff00"
                        : g.movement === "down"
                        ? "#ff4d4d"
                        : "#00ffc3",
                    fontWeight: "bold"
                  }}
                >
                  {g.bestAway.odds} ({g.bestAway.book})
                  {g.movement === "up" && " ↑"}
                  {g.movement === "down" && " ↓"}
                </span>
              </div>

              {/* HOME */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{g.home}</span>
                <span style={{ color: "#00ffc3", fontWeight: "bold" }}>
                  {g.bestHome.odds} ({g.bestHome.book})
                </span>
              </div>

              {/* 🔵 ARBITRAGE TAG */}
              {isArb && (
                <div style={{ color: "#00bfff", marginTop: "6px" }}>
                  💰 Arbitrage Opportunity
                </div>
              )}

              {/* VALUE */}
              {!isPro ? (
                <LockedFeature>
                  <div style={{ marginTop: "10px" }}>
                    ⭐ EV Edge: +3%+ <br />
                    💰 Arbitrage: 1%+
                  </div>
                </LockedFeature>
              ) : (
                <div style={{ marginTop: "10px", color: "#00ffc3" }}>
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