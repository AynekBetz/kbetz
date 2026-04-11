"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [aiPick, setAiPick] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API_URL}/api/data`);
      const data = await res.json();

      setGames(data.games);
      setAiPick(data.aiPick);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        🔥 KBETZ (STABLE)
      </h1>

      {/* AI PICK */}
      {aiPick && (
        <div className="mb-6 p-4 bg-purple-800 rounded-xl">
          <h2 className="font-bold mb-2">🧠 AI PICK</h2>
          <div>{aiPick.matchup}</div>
          <div className="text-xl font-bold">
            {aiPick.odds}
          </div>
          <div>EV: {aiPick.ev}%</div>
          <div>Confidence: {aiPick.confidence}</div>
        </div>
      )}

      {/* GAMES */}
      <div className="grid gap-3">
        {games.map((g) => (
          <div
            key={g.id}
            className="p-4 bg-gray-900 rounded-lg"
          >
            <div className="flex justify-between">
              <span>{g.away} @ {g.home}</span>
              <span>{g.odds}</span>
            </div>
            <div className="text-sm text-gray-400">
              EV: {g.ev}%
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}