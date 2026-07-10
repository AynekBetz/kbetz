"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://kbetz-main.onrender.com";

function formatDate(value) {
  if (!value) return "TBD";

  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function statusClass(result) {
  const value = String(result || "pending").toLowerCase();

  if (value === "win") return "record-pill win";
  if (value === "loss") return "record-pill loss";
  if (value === "push") return "record-pill push";

  return "record-pill pending";
}

export default function RecordPage() {
  const [record, setRecord] = useState(null);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadRecord() {
    try {
      setErr("");

      const [recordRes, picksRes] = await Promise.all([
        fetch(`${API_URL}/api/picks/record`, { cache: "no-store" }),
        fetch(`${API_URL}/api/picks/public?limit=25`, { cache: "no-store" }),
      ]);

      const recordJson = await recordRes.json();
      const picksJson = await picksRes.json();

      if (!recordJson.success) {
        throw new Error(recordJson.error || "Could not load record.");
      }

      if (!picksJson.success) {
        throw new Error(picksJson.error || "Could not load picks.");
      }

      setRecord(recordJson);
      setPicks(Array.isArray(picksJson.picks) ? picksJson.picks : []);
    } catch (error) {
      setErr(error.message || "Record page could not load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecord();

    const timer = setInterval(loadRecord, 30000);
    return () => clearInterval(timer);
  }, []);

  const recentPicks = useMemo(() => {
    return [...picks].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.postedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.postedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [picks]);

  return (
    <main className="record-page">
      <section className="record-hero">
        <div>
          <p className="record-kicker">KBETZ PUBLIC TRACKING</p>
          <h1>KBETZ Public Record</h1>
          <p className="record-subtitle">
            Every logged pick is tracked with its posted time, odds source,
            confidence, edge, result status, and model version.
          </p>
        </div>

        <div className="record-actions">
          <Link href="/" className="record-link">
            Home
          </Link>
          <Link href="/dashboard" className="record-link primary">
            Open Dashboard
          </Link>
        </div>
      </section>

      {loading && (
        <section className="record-card">
          <p className="record-muted">Loading KBETZ record...</p>
        </section>
      )}

      {!loading && err && (
        <section className="record-card record-error">
          <h2>Record temporarily unavailable</h2>
          <p>{err}</p>
          <button onClick={loadRecord} className="record-button">
            Try Again
          </button>
        </section>
      )}

      {!loading && !err && (
        <>
          <section className="record-grid">
            <div className="record-stat">
              <span>Total Picks</span>
              <strong>{record?.total ?? 0}</strong>
            </div>

            <div className="record-stat">
              <span>Pending</span>
              <strong>{record?.pending ?? 0}</strong>
            </div>

            <div className="record-stat">
              <span>Wins</span>
              <strong>{record?.wins ?? 0}</strong>
            </div>

            <div className="record-stat">
              <span>Losses</span>
              <strong>{record?.losses ?? 0}</strong>
            </div>

            <div className="record-stat">
              <span>Pushes</span>
              <strong>{record?.pushes ?? 0}</strong>
            </div>

            <div className="record-stat">
              <span>ROI</span>
              <strong>{Number(record?.roi || 0).toFixed(2)}%</strong>
            </div>
          </section>

          <section className="record-card">
            <div className="record-section-head">
              <div>
                <h2>Recent Logged Picks</h2>
                <p>
                  These are public KBETZ picks saved from the live odds engine.
                </p>
              </div>

              <button onClick={loadRecord} className="record-button">
                Refresh
              </button>
            </div>

            {recentPicks.length === 0 ? (
              <p className="record-muted">
                No picks have been logged yet. Run a pick snapshot to populate
                the public record.
              </p>
            ) : (
              <div className="record-table-wrap">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>Pick</th>
                      <th>Game</th>
                      <th>Odds</th>
                      <th>Confidence</th>
                      <th>Edge</th>
                      <th>Status</th>
                      <th>Posted</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentPicks.map((pick) => (
                      <tr key={pick._id || pick.pickKey}>
                        <td>
                          <strong>{pick.recommended || pick.bestLine}</strong>
                          <small>{pick.league || pick.sport}</small>
                        </td>

                        <td>
                          <strong>
                            {pick.away || "Away"} @ {pick.home || "Home"}
                          </strong>
                          <small>{formatDate(pick.commenceTime)}</small>
                        </td>

                        <td>
                          <strong>
                            {pick.recommended &&
                            pick.recommended.includes(pick.away)
                              ? pick.awayOdds
                              : pick.homeOdds}
                          </strong>
                          <small>source: {pick.oddsSource || "live"}</small>
                        </td>

                        <td>{Number(pick.confidence || 0)}%</td>
                        <td>{Number(pick.edge || 0)}%</td>

                        <td>
                          <span className={statusClass(pick.result)}>
                            {pick.result || "pending"}
                          </span>
                        </td>

                        <td>
                          <span>{formatDate(pick.createdAt || pick.postedAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="record-card record-disclaimer">
            <h2>Responsible Use</h2>
            <p>
              KBETZ provides sports analytics, odds tracking, and public record
              transparency. It does not guarantee wins. Betting involves risk,
              and users should only wager responsibly where legal.
            </p>
            <p>
              Model version:{" "}
              <strong>{record?.modelVersion || "kbetz-live-odds-v1"}</strong>
            </p>
          </section>
        </>
      )}

      <style jsx>{`
        .record-page {
          min-height: 100vh;
          padding: 32px;
          color: #f8fbff;
          background:
            radial-gradient(circle at top left, rgba(0, 255, 179, 0.18), transparent 32%),
            radial-gradient(circle at top right, rgba(130, 65, 255, 0.24), transparent 30%),
            linear-gradient(135deg, #040711 0%, #090f1f 45%, #120824 100%);
        }

        .record-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto 24px;
          padding: 28px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(18px);
        }

        .record-kicker {
          margin: 0 0 10px;
          color: #00ffb3;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 72px);
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        .record-subtitle {
          max-width: 760px;
          margin: 18px 0 0;
          color: rgba(248, 251, 255, 0.74);
          font-size: 17px;
          line-height: 1.6;
        }

        .record-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .record-link,
        .record-button {
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          padding: 12px 16px;
          color: #f8fbff;
          background: rgba(255, 255, 255, 0.08);
          text-decoration: none;
          font-weight: 800;
          cursor: pointer;
        }

        .record-link.primary,
        .record-button:hover {
          border-color: rgba(0, 255, 179, 0.44);
          background: linear-gradient(135deg, rgba(0, 255, 179, 0.22), rgba(130, 65, 255, 0.22));
        }

        .record-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 14px;
          max-width: 1200px;
          margin: 0 auto 24px;
        }

        .record-stat,
        .record-card {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.065);
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
        }

        .record-stat {
          padding: 20px;
        }

        .record-stat span {
          display: block;
          margin-bottom: 8px;
          color: rgba(248, 251, 255, 0.66);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .record-stat strong {
          font-size: 34px;
          letter-spacing: -0.04em;
        }

        .record-card {
          max-width: 1200px;
          margin: 0 auto 24px;
          padding: 24px;
        }

        .record-section-head {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          margin-bottom: 18px;
        }

        .record-section-head h2,
        .record-disclaimer h2,
        .record-error h2 {
          margin: 0 0 8px;
          font-size: 24px;
        }

        .record-section-head p,
        .record-disclaimer p,
        .record-error p,
        .record-muted {
          margin: 0;
          color: rgba(248, 251, 255, 0.68);
          line-height: 1.6;
        }

        .record-table-wrap {
          overflow-x: auto;
        }

        .record-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 880px;
        }

        .record-table th {
          padding: 12px;
          color: rgba(248, 251, 255, 0.56);
          font-size: 12px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .record-table td {
          padding: 16px 12px;
          vertical-align: top;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .record-table td strong {
          display: block;
          margin-bottom: 4px;
        }

        .record-table td small {
          display: block;
          color: rgba(248, 251, 255, 0.56);
        }

        .record-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 74px;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .record-pill.pending {
          color: #f8fbff;
          background: rgba(255, 255, 255, 0.12);
        }

        .record-pill.win {
          color: #04130d;
          background: #00ffb3;
        }

        .record-pill.loss {
          color: #ffffff;
          background: rgba(255, 74, 110, 0.9);
        }

        .record-pill.push {
          color: #07101d;
          background: rgba(255, 214, 102, 0.95);
        }

        .record-error {
          border-color: rgba(255, 74, 110, 0.45);
        }

        .record-disclaimer {
          border-color: rgba(0, 255, 179, 0.18);
        }

        @media (max-width: 900px) {
          .record-page {
            padding: 18px;
          }

          .record-hero {
            flex-direction: column;
            padding: 22px;
          }

          .record-actions {
            justify-content: flex-start;
          }

          .record-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .record-section-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
