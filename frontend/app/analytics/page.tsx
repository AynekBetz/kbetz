"use client";

import { useEffect, useState } from "react";
import { getBets, updateBetResult } from "../../utils/betStore";

export default function AnalyticsPage() {
  const [bets, setBets] = useState<any[]>([]);

  useEffect(() => {
    setBets(getBets());
  }, []);

  const refresh = () => {
    setBets(getBets());
  };

  const wins = bets.filter((b) => b.result === "win").length;
  const losses = bets.filter((b) => b.result === "loss").length;

  const profit = bets.reduce((acc, b) => {
    if (b.result === "win") {
      return acc + (b.odds > 0 ? b.odds / 100 : 100 / Math.abs(b.odds));
    }
    if (b.result === "loss") {
      return acc - 1;
    }
    return acc;
  }, 0);

  const roi = bets.length ? (profit / bets.length) * 100 : 0;

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">
        Analytics Dashboard
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-zinc-900 p-4 rounded">
          <div>Total Bets</div>
          <div className="text-xl font-bold">{bets.length}</div>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <div>Wins</div>
          <div className="text-xl font-bold text-green-400">{wins}</div>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <div>Losses</div>
          <div className="text-xl font-bold text-red-400">{losses}</div>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <div>ROI</div>
          <div className="text-xl font-bold text-yellow-400">
            {roi.toFixed(1)}%
          </div>
        </div>

      </div>

      {/* BET LIST */}
      <div className="space-y-2">
        {bets.map((b, i) => (
          <div
            key={i}
            className="bg-zinc-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              {b.team} ({b.odds})
            </div>

            <div className="flex gap-2">

              <button
                onClick={() => {
                  updateBetResult(i, "win");
                  refresh();
                }}
                className="bg-green-500 px-2 py-1 rounded text-black"
              >
                Win
              </button>

              <button
                onClick={() => {
                  updateBetResult(i, "loss");
                  refresh();
                }}
                className="bg-red-500 px-2 py-1 rounded text-black"
              >
                Loss
              </button>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}