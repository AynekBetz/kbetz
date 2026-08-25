"use client";

import { useEffect, useMemo, useState } from "react";
import { buildAIParlays } from "../../utils/aiParlay";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://kbetz-live.onrender.com";

function formatOdds(odds) {
  const n = Number(odds);
  if (!Number.isFinite(n)) return "—";
  return n > 0 ? `+${n}` : String(n);
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function extractGames(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.games)) return payload.games;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.odds)) return payload.odds;
  if (Array.isArray(payload?.events)) return payload.events;
  return [];
}

function matchupFor(leg) {
  return `${leg?.away || "Away"} @ ${leg?.home || "Home"}`;
}

export default function ParlayPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("safer");

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
        setMessage(
          "No live odds returned yet. Try again when markets are active."
        );
      }
    } catch (err) {
      setGames([]);
      setMessage(
        err?.message || "Could not build AI parlays right now."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOdds();
  }, []);

  const parlayBoard = useMemo(
    () => buildAIParlays(games),
    [games]
  );

  const activeParlay =
    mode === "balanced"
      ? parlayBoard.balanced
      : mode === "aggressive"
        ? parlayBoard.aggressive
        : parlayBoard.safer;

  const modeName =
    mode === "balanced"
      ? "Balanced"
      : mode === "aggressive"
        ? "Aggressive"
        : "Safer";

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="tag">KBETZ VERIFIED AI PARLAY BOARD</p>

          <h1>Ready-Made AI Parlays</h1>

          <p className="sub">
            KBETZ scans verified live sportsbook markets and automatically
            builds parlays from selections that pass its market-quality
            standards. Weak markets are not forced into a parlay.
          </p>

          <div className="trustBanner">
            <strong>Trust Notice:</strong> KBETZ provides sports analytics,
            market insights, and AI-assisted selections. Market scores are
            ranking signals, not guaranteed win probabilities. No pick,
            parlay, hedge, or prediction is guaranteed. Bet responsibly.
          </div>
        </div>

        <div className="heroLinks">
          <a href="/dashboard">← Dashboard</a>
          <a href="/record">Public Record</a>
        </div>
      </section>

      <section className="controls">
        <button
          className={mode === "safer" ? "active" : ""}
          onClick={() => setMode("safer")}
        >
          🛡️ Safer AI Parlay
        </button>

        <button
          className={mode === "balanced" ? "active" : ""}
          onClick={() => setMode("balanced")}
        >
          🎯 Balanced AI Parlay
        </button>

        <button
          className={mode === "aggressive" ? "active" : ""}
          onClick={() => setMode("aggressive")}
        >
          🔥 Aggressive AI Parlay
        </button>

        <button onClick={loadOdds}>Refresh Markets</button>
      </section>

      <section className="boardStatus">
        <strong>
          {parlayBoard.qualifiedLegs} verified market
          {parlayBoard.qualifiedLegs === 1 ? "" : "s"} qualified
        </strong>

        <span>
          KBETZ requires verified sportsbook pricing, market consensus,
          market quality, and acceptable movement evidence.
        </span>
      </section>

      <section className="summary">
        <div>
          <span>Parlay</span>
          <strong>{modeName}</strong>
        </div>

        <div>
          <span>Legs</span>
          <strong>
            {activeParlay.available
              ? activeParlay.legCount
              : "—"}
          </strong>
        </div>

        <div>
          <span>Market Quality</span>
          <strong>
            {activeParlay.available
              ? activeParlay.averageMarketQuality
              : "—"}
          </strong>
        </div>

        <div>
          <span>Risk</span>
          <strong>
            {activeParlay.available
              ? activeParlay.risk
              : "Unavailable"}
          </strong>
        </div>

        <div>
          <span>Combined Odds</span>
          <strong>
            {activeParlay.available
              ? formatOdds(activeParlay.combinedOdds)
              : "—"}
          </strong>
        </div>
      </section>

      {activeParlay.available && (
        <section className="payouts">
          <div>
            <span>$10 Est. Return</span>
            <strong>
              {money(activeParlay.estimatedPayouts?.[10])}
            </strong>
          </div>

          <div>
            <span>$25 Est. Return</span>
            <strong>
              {money(activeParlay.estimatedPayouts?.[25])}
            </strong>
          </div>

          <div>
            <span>$50 Est. Return</span>
            <strong>
              {money(activeParlay.estimatedPayouts?.[50])}
            </strong>
          </div>

          <div>
            <span>Avg Consensus</span>
            <strong>
              {activeParlay.averageConsensus}%
            </strong>
          </div>
        </section>
      )}

      {loading && (
        <div className="notice">
          Scanning verified markets and building AI parlays...
        </div>
      )}

      {!loading && message && (
        <div className="notice">{message}</div>
      )}

      {!loading &&
        !message &&
        !activeParlay.available && (
          <div className="notice">
            <strong>No qualified {modeName} AI Parlay right now.</strong>
            <br />
            {activeParlay.reason ||
              "KBETZ will not lower its market-quality standards just to fill a parlay."}
          </div>
        )}

      {!loading && activeParlay.available && (
        <section className="legs">
          {activeParlay.legs.map((leg, index) => (
            <article
              className="card"
              key={
                leg.id ||
                `${leg.away}-${leg.home}-${leg.team}-${index}`
              }
            >
              <div className="top">
                <span>Leg {index + 1}</span>
                <b>Score {leg.selectionScore}</b>
              </div>

              <h2>{leg.team}</h2>

              <p className="matchup">
                {matchupFor(leg)}
              </p>

              <div className="grid">
                <p>
                  <span>Odds</span>
                  {formatOdds(leg.odds)}
                </p>

                <p>
                  <span>Sport</span>
                  {leg.sport || "Sports"}
                </p>

                <p>
                  <span>Market Quality</span>
                  {leg.marketQuality}
                </p>

                <p>
                  <span>Consensus</span>
                  {leg.consensus}%
                </p>

                <p>
                  <span>Movement</span>
                  {leg.movementAgreement > 0
                    ? `${leg.movementAgreement}%`
                    : "Stable / Neutral"}
                </p>

                <p>
                  <span>Books Used</span>
                  {leg.booksUsed}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="warning">
        <strong>Responsible Use:</strong> Parlays are harder to win than
        individual selections because every leg must win. Estimated returns
        are mathematical calculations from the displayed odds and are not
        guaranteed winnings. KBETZ may show fewer parlays when the available
        markets do not meet its qualification standards.
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          color: white;
          background:
            radial-gradient(
              circle at top left,
              rgba(0, 255, 214, 0.18),
              transparent 32%
            ),
            radial-gradient(
              circle at top right,
              rgba(210, 45, 255, 0.22),
              transparent 30%
            ),
            linear-gradient(135deg, #020707, #14051f, #030711);
          font-family: Arial, sans-serif;
        }

        .hero,
        .controls,
        .summary div,
        .payouts div,
        .card,
        .notice,
        .warning,
        .boardStatus {
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
          background: linear-gradient(
            90deg,
            #fff,
            #d8b4fe,
            #67e8f9
          );
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

        .boardStatus {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 18px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .boardStatus strong {
          color: #67e8f9;
        }

        .boardStatus span {
          color: rgba(255, 255, 255, 0.66);
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .payouts {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .summary div,
        .payouts div {
          padding: 16px;
        }

        .summary span,
        .payouts span,
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

        .summary strong,
        .payouts strong {
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
          .hero,
          .boardStatus {
            flex-direction: column;
          }

          .summary,
          .payouts,
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
