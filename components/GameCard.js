"use client";

import { useEffect } from "react";
import useOddsTracker from "../hooks/useOddsTracker";
import useOddsHistory from "../hooks/useOddsHistory";

export default function GameCard({ games, onSelectBet }) {
  const movementMap = useOddsTracker(games);
  const historyMap = useOddsHistory(games);

  // 🔊 SOUND ALERT ON BIG MOVES
  useEffect(() => {
    const audio = new Audio("/tick.mp3");

    Object.values(movementMap).forEach((m) => {
      if (Math.abs(parseFloat(m.percent)) > 5) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    });
  }, [movementMap]);

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <div
          key={game.id}
          className="bg-zinc-900 p-4 rounded-xl border border-zinc-800"
        >
          {/* Teams */}
          <div className="flex justify-between mb-3">
            <div className="font-bold">{game.home_team}</div>
            <div className="font-bold">{game.away_team}</div>
          </div>

          {/* Odds Row */}
          <div className="flex gap-2">
            {game.markets?.[0]?.outcomes?.map((outcome) => {
              const key = `${game.id}-${outcome.name}`;
              const movement = movementMap[key];
              const history = historyMap[key] || [];

              // 🔥 SHARP MONEY DETECTION (big jump)
              const sharp =
                history.length >= 2 &&
                Math.abs(
                  history[history.length - 1] -
                    history[history.length - 2]
                ) >= 20;

              return (
                <button
                  key={outcome.name}
                  onClick={() =>
                    onSelectBet({
                      gameId: game.id,
                      team: outcome.name,
                      odds: outcome.price,
                    })
                  }
                  className={`odds-btn
                    ${movement?.direction === "up" ? "odds-up" : ""}
                    ${movement?.direction === "down" ? "odds-down" : ""}
                    ${sharp ? "ring-2 ring-yellow-400" : ""}
                  `}
                >
                  <div className="flex flex-col items-center">

                    {/* TEAM NAME */}
                    <span className="text-xs">{outcome.name}</span>

                    {/* ODDS */}
                    <span className="text-sm font-bold">
                      {outcome.price > 0 ? "+" : ""}
                      {outcome.price}
                    </span>

                    {/* MOVEMENT */}
                    {movement && (
                      <span
                        className={`text-xs flex items-center gap-1
                          ${
                            movement.direction === "up"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        `}
                      >
                        {movement.direction === "up" ? "⬆" : "⬇"}
                        {movement.percent}%
                      </span>
                    )}

                    {/* SHARP TAG */}
                    {sharp && (
                      <span className="text-[10px] text-yellow-400">
                        🔥 sharp
                      </span>
                    )}

                    {/* MINI GRAPH */}
                    <div className="flex gap-[2px] mt-1 items-end h-[30px]">
                      {history.map((h, i) => (
                        <div
                          key={i}
                          className="w-[3px] bg-green-400"
                          style={{
                            height: `${Math.max(5, Math.abs(h) / 10)}px`,
                          }}
                        />
                      ))}
                    </div>

                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}