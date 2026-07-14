"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://kbetz-main.onrender.com";

function americanToDecimal(odds) {
  const n = Number(odds);
  if (!Number.isFinite(n) || n === 0) return 1;

  if (n > 0) return 1 + n / 100;
  return 1 + 100 / Math.abs(n);
}

function impliedProbability(odds) {
  const n = Number(odds);
  if (!Number.isFinite(n) || n === 0) return 0;

  if (n > 0) return 100 / (n + 100);
  return Math.abs(n) / (Math.abs(n) + 100);
}

function formatOdds(odds) {
  const n = Number(odds);
  if (!Number.isFinite(n)) return "—";
  return n > 0 ? `+${n}` : String(n);
}

function extractGames(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.games)) return payload.games;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.odds)) return payload.odds;
  if (Array.isArray(payload?.events)) return payload.events;

  return [];
}

function getBookmakers(game) {
  if (Array.isArray(game.bookmakers)) return game.bookmakers;
  if (Array.isArray(game.books)) return game.books;
  return [];
}

function getMoneylineOutcomes(game) {
  const bookmakers = getBookmakers(game);
  const outcomes = [];

  for (const book of bookmakers) {
    const bookName = book.title || book.key || book.name || "Sportsbook";
    const markets = Array.isArray(book.markets) ? book.markets : [];

    const h2h =
      markets.find((m) => m.key === "h2h") ||
      markets.find((m) => String(m.key || "").toLowerCase().includes("money")) ||
      markets[0];

    if (!h2h || !Array.isArray(h2h.outcomes)) continue;

    for (const outcome of h2h.outcomes) {
      if (!outcome?.name || outcome.price === undefined) continue;

      outcomes.push({
        team: outcome.name,
        odds: Number(outcome.price),
        book: bookName,
      });
    }
  }

  return outcomes;
}

function buildCandidatePicks(games) {
  const picks = [];

  for (const game of games) {
    const home = game.home_team || game.home || game.homeTeam || "Home";
    const away = game.away_team || game.away || game.awayTeam || "Away";
    const sport =
      game.sport_title || game.sport || game.league || game.sport_key || "Sports";

    const outcomes = getMoneylineOutcomes(game);

    if (outcomes.length < 2) continue;

    const bestByTeam = new Map();

    for (const outcome of outcomes) {
      const existing = bestByTeam.get(outcome.team);

      if (!existing) {
        bestByTeam.set(outcome.team, outcome);
        continue;
      }

      if (Number(outcome.odds) > Number(existing.odds)) {
        bestByTeam.set(outcome.team, outcome);
      }
    }

    const bestOutcomes = Array.from(bestByTeam.values());
    if (bestOutcomes.length < 2) continue;

    const sorted = [...bestOutcomes].sort((a, b) => {
      return impliedProbability(b.odds) - impliedProbability(a.odds);
    });

    const pick = sorted[0];
    const prob = impliedProbability(pick.odds);
    const confidence = Math.max(
      52,
      Math.min(82, Math.round(prob * 100 + 12))
    );

    const risk =
      confidence >= 72 ? "Lower" : confidence >= 64 ? "Medium" : "High";

    picks.push({
      id: `${game.id || game.commence_time || home}-${pick.team}`,
      sport,
      matchup: `${away} @ ${home}`,
      team: pick.team,
      odds: pick.odds,
      book: pick.book,
      confidence,
      risk,
      commenceTime: game.commence_time || game.commenceTime || "",
    });
  }

  return picks
    .filter((pick) => pick.confidence >= 58)
    .sort((a, b) => b.confidence - a.confidence);
}

function buildParlay(picks, mode) {
  const maxLegs = mode === "safe" ? 3 : 5;
  const minConfidence = mode === "safe" ? 64 : 58;

  const usedMatchups = new Set();
  const legs = [];

  for (const pick of picks) {
    if (legs.length >= maxLegs) break;
    if (pick.confidence < minConfidence) continue;
    if (usedMatchups.has(pick.matchup)) continue;

    usedMatchups.add(pick.matchup);
    legs.push(pick);
  }

  const decimal = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
  const stake = 10;
  const payout = decimal * stake;
  const profit = payout - stake;

  const avgConfidence =
    legs.length > 0
      ? Math.round(
          legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length
        )
      : 0;

  const risk =
    mode === "safe"
      ? legs.length <= 2
        ? "Medium"
        : "Medium-High"
      : "High";

  return {
    mode,
    legs,
    stake,
    payout,
    profit,
    avgConfidence,
    risk,
  };
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

export default function ParlayPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("safe");

  async function loadOdds() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API_URL}/api/odds`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Could not load odds.");
      }

      const list = extractGames(data);
      setGames(list);

      if (list.length === 0) {
        setMessage("No live odds returned yet. Try again when markets are active.");
      }
    } catch (err) {
      setGames([]);
      setMessage(err.message || "Could not build parlay right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOdds();
  }, []);

  const picks = useMemo(() => buildCandidatePicks(games), [games]);

  const safeParlay = useMemo(() => buildParlay(picks, "safe"), [picks]);
  const aggressiveParlay = useMemo(
    () => buildParlay(picks, "aggressive"),
    [picks]
  );

  const activeParlay = mode === "safe" ? safeParlay : aggressiveParlay;

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="tag">KBETZ AI PARLAY BUILDER</p>
          <h1>Build Smart Parlays</h1>
          <p className="sub">
            KBETZ scans live moneyline odds, ranks stronger legs, and labels
            risk honestly. Parlays are never guaranteed.
          </p>

          <div className="trustBanner">
            <strong>Trust Notice:</strong> KBETZ provides sports analytics,
            odds insights, and AI-assisted picks. No pick, parlay, hedge, or
            prediction is guaranteed. Bet responsibly and track results honestly.
          </div>
        </div>

        <div className="heroLinks">
          <a href="/dashboard">← Dashboard</a>
          <a href="/record">Public Record</a>
        </div>
      </section>

      <section className="controls">
        <button
          className={mode === "safe" ? "active" : ""}
          onClick={() => setMode("safe")}
        >
          🛡️ Safer Parlay
        </button>

        <button
          className={mode === "aggressive" ? "active" : ""}
          onClick={() => setMode("aggressive")}
        >
          🔥 Aggressive Parlay
        </button>

        <button onClick={loadOdds}>Refresh Odds</button>
      </section>

      <section className="summary">
        <div>
          <span>Mode</span>
          <strong>{mode === "safe" ? "Safer" : "Aggressive"}</strong>
        </div>

        <div>
          <span>Legs</span>
          <strong>{activeParlay.legs.length}</strong>
        </div>

        <div>
          <span>Avg Confidence</span>
          <strong>{activeParlay.avgConfidence}%</strong>
        </div>

        <div>
          <span>Risk</span>
          <strong>{activeParlay.risk}</strong>
        </div>

        <div>
          <span>$10 Est. Payout</span>
          <strong>{money(activeParlay.payout)}</strong>
        </div>
      </section>

      {loading && <div className="notice">Building AI parlay...</div>}
      {!loading && message && <div className="notice">{message}</div>}

      {!loading && activeParlay.legs.length === 0 && !message && (
        <div className="notice">
          Not enough qualifying legs right now. Try refreshing when more markets
          are live.
        </div>
      )}

      <section className="legs">
        {activeParlay.legs.map((leg, index) => (
          <article className="card" key={leg.id}>
            <div className="top">
              <span>Leg {index + 1}</span>
              <b>{leg.confidence}%</b>
            </div>

            <h2>{leg.team} ML</h2>
            <p className="matchup">{leg.matchup}</p>

            <div className="grid">
              <p>
                <span>Odds</span>
                {formatOdds(leg.odds)}
              </p>

              <p>
                <span>Book</span>
                {leg.book}
              </p>

              <p>
                <span>Sport</span>
                {leg.sport}
              </p>

              <p>
                <span>Risk</span>
                {leg.risk}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="warning">
        <strong>Responsible Use:</strong> Parlays are harder to win than single
        picks. KBETZ shows analytics, risk labels, and estimated payout only. No
        pick or parlay is guaranteed.
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          color: white;
          background:
            radial-gradient(circle at top left, rgba(0, 255, 214, 0.18), transparent 32%),
            radial-gradient(circle at top right, rgba(210, 45, 255, 0.22), transparent 30%),
            linear-gradient(135deg, #020707, #14051f, #030711);
          font-family: Arial, sans-serif;
        }

        .hero,
        .controls,
        .summary div,
        .card,
        .notice,
        .warning {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 22px;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
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
          font-size: clamp(40px, 7vw, 72px);
          line-height: 0.95;
          background: linear-gradient(90deg, #fff, #d8b4fe, #67e8f9);
          -webkit-background-clip: text;
          color: transparent;
        }

        .sub {
          max-width: 760px;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.6;
        }

        .trustBanner {
          max-width: 820px;
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 18px;
          color: rgba(255, 255, 255, 0.86);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(103, 232, 249, 0.22);
          line-height: 1.55;
          font-weight: 800;
        }

        .trustBanner strong {
          color: #67e8f9;
        }

        .heroLinks {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .heroLinks a,
        button {
          color: white;
          text-decoration: none;
          font-weight: 900;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.09);
          cursor: pointer;
        }

        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          padding: 16px;
          margin-bottom: 16px;
        }

        button.active {
          background: linear-gradient(90deg, #7c3aed, #06b6d4);
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .summary div {
          padding: 16px;
        }

        .summary span,
        .grid span,
        .top span {
          display: block;
          color: rgba(255, 255, 255, 0.56);
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
        }

        .summary strong {
          font-size: 22px;
        }

        .notice,
        .warning {
          padding: 16px;
          margin-bottom: 16px;
          color: rgba(255, 255, 255, 0.82);
          font-weight: 800;
          line-height: 1.55;
        }

        .legs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }

        .card {
          padding: 18px;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .top b {
          color: #67e8f9;
          background: rgba(34, 211, 238, 0.14);
          border: 1px solid rgba(103, 232, 249, 0.2);
          border-radius: 999px;
          padding: 8px 10px;
        }

        h2 {
          margin: 14px 0 8px;
          font-size: 24px;
        }

        .matchup {
          color: rgba(255, 255, 255, 0.68);
          font-weight: 800;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .grid p {
          margin: 0;
          padding: 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          font-weight: 900;
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
          }

          .summary,
          .legs {
            grid-template-columns: 1fr;
          }

          .page {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  );
}
