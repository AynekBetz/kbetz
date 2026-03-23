"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:10000/odds")
      .then((res) => res.json())
      .then((data) => {
        console.log("DATA:", data);
        setGames(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>KBETZ Sportsbook</h1>

      {loading && <p>Loading games...</p>}

      {!loading && games.length === 0 && (
        <p style={{ color: "red" }}>
          No games loaded (frontend issue)
        </p>
      )}

      {games.map((g) => (
        <div key={g.id} style={{ marginBottom: 20 }}>
          <h3>
            {g.away_team} vs {g.home_team}
          </h3>

          {g.markets?.[0]?.outcomes?.map((o: any, i: number) => (
            <button key={i} style={{ marginRight: 10 }}>
              {o.name} ({o.price})
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}