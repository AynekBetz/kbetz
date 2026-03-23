"use client";

import { useEffect, useRef, useState } from "react";

export default function useOddsTracker(data) {
  const prevDataRef = useRef({});
  const [movementMap, setMovementMap] = useState({});

  useEffect(() => {
    if (!data) return;

    const newMap = {};

    data.forEach((game) => {
      const prevGame = prevDataRef.current[game.id];

      if (prevGame) {
        game.markets?.forEach((market) => {
          market.outcomes?.forEach((outcome) => {
            const prevOutcome =
              prevGame.markets
                ?.find((m) => m.key === market.key)
                ?.outcomes?.find((o) => o.name === outcome.name);

            if (prevOutcome) {
              const diff = outcome.price - prevOutcome.price;

              if (diff !== 0) {
                const percent = (
                  (diff / Math.abs(prevOutcome.price)) *
                  100
                ).toFixed(1);

                newMap[`${game.id}-${outcome.name}`] = {
                  direction: diff > 0 ? "up" : "down",
                  percent,
                };
              }
            }
          });
        });
      }
    });

    setMovementMap(newMap);

    const snapshot = {};
    data.forEach((g) => {
      snapshot[g.id] = JSON.parse(JSON.stringify(g));
    });
    prevDataRef.current = snapshot;

    const timeout = setTimeout(() => {
      setMovementMap({});
    }, 1200);

    return () => clearTimeout(timeout);
  }, [data]);

  return movementMap;
}