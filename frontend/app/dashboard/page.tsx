"use client";

import { useEffect, useState, useRef } from "react";
import { isProUser, setProUser } from "../../lib/auth";
import LockedFeature from "../../components/LockedFeature";
import BetSlip from "../../components/BetSlip";
import { calculateEV, checkArbitrage } from "../../utils/calculations";
import { fetchOdds } from "../../utils/oddsFetcher";
import { buildAIParlay } from "../../utils/aiParlay";
import { winProbability, confidenceScore } from "../../utils/model";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [slip, setSlip] = useState<any[]>([]);
  const [aiPreview, setAiPreview] = useState<any[]>([]);

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
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
        }).catch(() => {});
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

      prevGamesRef.current = updated;
      setGames(updated);
      setAiPreview(buildAIParlay(updated));
    }

    loadOdds();
    const interval = setInterval(loadOdds, 15000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  function addPick(pick: any) {
    setSlip((prev) => [...prev, pick]);
  }

  function removePick(index: number) {
    setSlip((prev) => prev.filter((_, i) => i !== index));
  }

  function generateAIParlay() {
    const picks = buildAIParlay(games);
    setSlip(picks);
  }

  return (
    <div style={{ padding: "20px", marginRight: "320px" }}>
      <h1 className="title">🔥 KBETZ LIVE TERMINAL</h1>

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

      {/* 🤖 AI SECTION */}
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h2>🤖 AI Parlay Builder</h2>

        {!isPro ? (
          <LockedFeature>
            <div>
              {aiPreview.map((p, i) => (
                <div key={i}>
                  {p.team} ({p.odds})
                </div>
              ))}
              <div style={{ marginTop: "10px" }}>
                🔒 Unlock to see win probability & confidence
              </div>
            </div>
          </LockedFeature>
        ) : (
          <>
            {aiPreview.map((p, i) => {
              const ev = calculateEV(p.odds);
              const prob = winProbability(p.odds, ev);
              const confidence = confidenceScore(prob);

              return (
                <div key={i} style={{ marginBottom: "8px" }}>
                  {p.team} ({p.odds}) <br />
                  📊 Win %: {(prob * 100).toFixed(1)}% <br />
                  🔥 Confidence: {confidence}
                </div>
              );
            })}

            <button
              onClick={generateAIParlay}
              style={{
                marginTop: "10px",
                background: "#ffcc00",
                padding: "10px",
                borderRadius: "8px",
                fontWeight: "bold"
              }}
            >
              Add AI Parlay
            </button>
          </>
        )}
      </div>

      {/* GAMES + SLIP unchanged */}
      <BetSlip slip={slip} removePick={removePick} />
    </div>
  );
}