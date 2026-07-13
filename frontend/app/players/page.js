"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://kbetz-main.onrender.com";

const NFL_TEAMS = [
  ["ARI", "Arizona Cardinals"],
  ["ATL", "Atlanta Falcons"],
  ["BAL", "Baltimore Ravens"],
  ["BUF", "Buffalo Bills"],
  ["CAR", "Carolina Panthers"],
  ["CHI", "Chicago Bears"],
  ["CIN", "Cincinnati Bengals"],
  ["CLE", "Cleveland Browns"],
  ["DAL", "Dallas Cowboys"],
  ["DEN", "Denver Broncos"],
  ["DET", "Detroit Lions"],
  ["GB", "Green Bay Packers"],
  ["HOU", "Houston Texans"],
  ["IND", "Indianapolis Colts"],
  ["JAX", "Jacksonville Jaguars"],
  ["KC", "Kansas City Chiefs"],
  ["LV", "Las Vegas Raiders"],
  ["LAC", "Los Angeles Chargers"],
  ["LAR", "Los Angeles Rams"],
  ["MIA", "Miami Dolphins"],
  ["MIN", "Minnesota Vikings"],
  ["NE", "New England Patriots"],
  ["NO", "New Orleans Saints"],
  ["NYG", "New York Giants"],
  ["NYJ", "New York Jets"],
  ["PHI", "Philadelphia Eagles"],
  ["PIT", "Pittsburgh Steelers"],
  ["SF", "San Francisco 49ers"],
  ["SEA", "Seattle Seahawks"],
  ["TB", "Tampa Bay Buccaneers"],
  ["TEN", "Tennessee Titans"],
  ["WAS", "Washington Commanders"],
];

function playerName(p) {
  return (
    p.Name ||
    p.FullName ||
    `${p.FirstName || ""} ${p.LastName || ""}`.trim() ||
    "Unknown Player"
  );
}

function value(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function PlayersPage() {
  const [team, setTeam] = useState("CAR");
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPlayers(nextTeam = team, nextQuery = query) {
    setLoading(true);
    setMessage("");

    try {
      const cleanQuery = String(nextQuery || "").trim();

      const url = cleanQuery
        ? `${API_URL}/api/sportsdata/nfl/player-search?team=${encodeURIComponent(
            nextTeam
          )}&q=${encodeURIComponent(cleanQuery)}`
        : `${API_URL}/api/sportsdata/nfl/roster?team=${encodeURIComponent(
            nextTeam
          )}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not load players.");
      }

      const list = Array.isArray(data.players) ? data.players : [];

      setPlayers(list);
      setCount(Number(data.count || list.length || 0));

      if (list.length === 0) {
        setMessage("No players returned yet. Try another team or clear search.");
      }
    } catch (err) {
      setPlayers([]);
      setCount(0);
      setMessage(err.message || "Could not load players.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayers(team, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  function searchPlayers(e) {
    e.preventDefault();
    loadPlayers(team, query);
  }

  function clearSearch() {
    setQuery("");
    loadPlayers(team, "");
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="tag">KBETZ PLAYER CENTER</p>
          <h1>NFL Players</h1>
          <p className="sub">
            Rosters and player lookup powered by your SportsDataIO connection.
            Game stats will show once games are played and stats are returned.
          </p>
        </div>

        <a href="/dashboard" className="back">
          ← Dashboard
        </a>
      </section>

      <section className="controls">
        <label>
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            {NFL_TEAMS.map(([abbr, name]) => (
              <option key={abbr} value={abbr}>
                {abbr} — {name}
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={searchPlayers}>
          <label>
            Search
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="QB, RB, WR, player name..."
            />
          </label>

          <button type="submit">Search</button>
          <button type="button" onClick={clearSearch}>
            Clear
          </button>
        </form>
      </section>

      <section className="stats">
        <div>
          <span>Team</span>
          <strong>{team}</strong>
        </div>
        <div>
          <span>Players Found</span>
          <strong>{count}</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>SportsDataIO</strong>
        </div>
      </section>

      {loading && <p className="notice">Loading players...</p>}
      {!loading && message && <p className="notice">{message}</p>}

      <section className="grid">
        {players.map((p, index) => (
          <article
            className="card"
            key={p.PlayerID || p.GlobalPlayerID || `${playerName(p)}-${index}`}
          >
            <div className="top">
              <div>
                <h2>{playerName(p)}</h2>
                <p>
                  {value(p.Team || team)} • {value(p.Position)}
                </p>
              </div>
              <b>#{value(p.Number || p.Jersey)}</b>
            </div>

            <div className="info">
              <p>
                <span>Status</span>
                {value(p.Status || p.Active || p.TeamStatus)}
              </p>
              <p>
                <span>Height</span>
                {value(p.Height)}
              </p>
              <p>
                <span>Weight</span>
                {value(p.Weight)}
              </p>
              <p>
                <span>College</span>
                {value(p.College)}
              </p>
            </div>
          </article>
        ))}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          color: white;
          background: linear-gradient(135deg, #05030d, #150525, #030711);
          font-family: Arial, sans-serif;
        }

        .hero,
        .controls,
        .card,
        .notice,
        .stats div {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 22px;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.35);
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 26px;
          margin-bottom: 18px;
        }

        .tag {
          color: #67e8f9;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.18em;
          margin: 0 0 10px;
        }

        h1 {
          margin: 0;
          font-size: 52px;
          background: linear-gradient(90deg, #fff, #d8b4fe, #67e8f9);
          -webkit-background-clip: text;
          color: transparent;
        }

        .sub {
          color: rgba(255, 255, 255, 0.72);
          max-width: 760px;
          line-height: 1.55;
        }

        .back {
          color: white;
          text-decoration: none;
          font-weight: 900;
          height: fit-content;
          padding: 12px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
        }

        .controls {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 14px;
          padding: 18px;
          margin-bottom: 16px;
        }

        form {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 10px;
          align-items: end;
        }

        label {
          display: grid;
          gap: 8px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        select,
        input,
        button {
          min-height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          padding: 0 12px;
        }

        select,
        input {
          color: white;
          background: rgba(255, 255, 255, 0.09);
        }

        option {
          color: black;
        }

        button {
          color: white;
          background: linear-gradient(90deg, #7c3aed, #06b6d4);
          font-weight: 900;
          cursor: pointer;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stats div {
          padding: 16px;
        }

        .stats span,
        .info span {
          display: block;
          color: rgba(255, 255, 255, 0.55);
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
        }

        .stats strong {
          font-size: 24px;
        }

        .notice {
          padding: 16px;
          font-weight: 800;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .card {
          padding: 18px;
        }

        .top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
        }

        .top p {
          color: rgba(255, 255, 255, 0.62);
          font-weight: 800;
        }

        .top b {
          color: #67e8f9;
          background: rgba(34, 211, 238, 0.16);
          border-radius: 999px;
          padding: 8px 10px;
          height: fit-content;
        }

        .info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .info p {
          margin: 0;
          padding: 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .hero,
          .controls,
          form,
          .stats,
          .grid {
            grid-template-columns: 1fr;
          }

          .hero {
            flex-direction: column;
          }

          .page {
            padding: 16px;
          }

          h1 {
            font-size: 42px;
          }
        }
      `}</style>
    </main>
  );
}
