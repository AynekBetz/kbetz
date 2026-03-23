"use client";

import { useEffect, useState } from "react";

export default function useOddsHistory(data) {
  const [historyMap, setHistoryMap] = useState({});

  useEffect(() => {
    if (!data) return;

    setHistoryMap((prev) => {
      const updated = { ...prev };

      data.forEach((game) => {
        game.markets?.forEach((market) => {
          market.outcomes?.forEach((outcome) => {
            const key = `${game.id}-${outcome.name}`;

            if (!updated[key]) updated[key] = [];

            updated[key] = [
              ...updated[key].slice(-9),
              outcome.price,
            ];
          });
        });
      });

      return updated;
    });
  }, [data]);

  return historyMap;
}