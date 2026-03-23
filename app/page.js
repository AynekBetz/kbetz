"use client";

import { useEffect, useState } from "react";
import GameCard from "../components/GameCard";

export default function HomePage() {
  const [games, setGames] = useState([]);
  const [betslip, setBetslip] = useState([]);
  const [stake, setStake] = useState(10);
  const [activeTab, setActiveTab] = useState("LIVE");

  const fetchOdds = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/odds`
      );
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchOdds();
    const interval = setInterval(fetchOdds, 5000);
    return () => clearInterval(interval);
  }, []);

  const addToBetSlip = (bet) => {
    setBetslip((prev) => [...prev, bet]);
  };

  // 🧠 FILTER LOGIC
  const filteredGames = games.filter((game) => {
    if (activeTab === "LIVE") {
      return game.commence_time
        ? new Date(game.commence_time) < new Date()
        : false;
    }

    if (activeTab === "NBA") {
      return game.sport_key?.includes("basketball");
    }

    if (activeTab === "NFL") {
      return game.sport_key?.includes("football");
    }

    return true;
  });

  // 🧠 PARLAY CALC
  const calculatePayout = () => {
    if (betslip.length === 0) return 0;

    let totalOdds = 1;

    betslip.forEach((bet) => {
      let decimal =
        bet.odds > 0
          ? 1 + bet.odds / 100
          : 1 + 100 / Math.abs(bet.odds);

      totalOdds *= decimal;
    });

    return (stake * totalOdds).toFixed(2);
  };

  const totalOddsDisplay = () => {
    if (betslip.length === 0) return "0.00x";

    let total = 1;

    betslip.forEach((bet) => {
      let decimal =
        bet.odds > 0
          ? 1 + bet.odds / 100
          : 1 + 100 / Math.abs(bet.odds);

      total *= decimal;
    });

    return total.toFixed(2) + "x";
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">
        KBETZ Sportsbook
      </h1>

      {/* 🔥 TABS */}
      <div className="flex gap-3 mb-4">
        {["LIVE", "NBA", "NFL"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold
              ${
                activeTab === tab
                  ? "bg-green-500 text-black"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* GAMES */}
      <GameCard games={filteredGames} onSelectBet={addToBetSlip} />

      {/* BET SLIP */}
      <div className="fixed right-0 top-0 w-80 h-full bg-zinc-900 p-4 border-l border-zinc-800 flex flex-col">

        <h2 className="font-bold mb-3">Bet Slip</h2>

        {/* Stake */}
        <div className="mb-3">
          <label className="text-sm">Stake ($)</label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full mt-1 p-2 bg-black border border-zinc-700 rounded"
          />
        </div>

        {/* Bets */}
        <div className="flex-1 overflow-y-auto">
          {betslip.length === 0 && (
            <p className="text-sm text-zinc-400">
              No bets yet
            </p>
          )}

          {betslip.map((bet, i) => (
            <div
              key={i}
              className="mb-2 p-2 bg-black rounded border border-zinc-700"
            >
              <div className="text-sm font-semibold">
                {bet.team}
              </div>
              <div className="text-xs text-zinc-400">
                Odds: {bet.odds}
              </div>
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div className="mt-4 border-t border-zinc-700 pt-3">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Total Odds</span>
            <span>{totalOddsDisplay()}</span>
          </div>

          <div className="flex justify-between text-sm text-zinc-400 mt-1">
            <span>Stake</span>
            <span>${stake}</span>
          </div>

          <div className="mt-3">
            <div className="text-sm text-zinc-400">
              Potential Payout
            </div>
            <div className="text-xl font-bold text-green-400">
              ${calculatePayout()}
            </div>
          </div>

          <button className="mt-4 w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 rounded">
            Place Bet
          </button>
        </div>
      </div>
    </div>
  );
}