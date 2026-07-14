"use client";

const steps = [
  ["1. Dashboard", "Start on the dashboard. This is where you view live odds, AI picks, parlay tools, PRO features, and quick links."],
  ["2. Live Odds", "Compare teams, prices, sportsbooks, and market movement. Odds can change quickly, so always refresh before making decisions."],
  ["3. AI Picks", "KBETZ gives AI-assisted sports insights based on available odds and data. These are not guaranteed wins."],
  ["4. AI Parlay", "Use AI Parlay for safer or aggressive parlay ideas. Parlays are higher risk than single picks, so use smaller stakes."],
  ["5. Player Stats", "Use Player Stats to review roster and player information. Live game stats depend on available data feeds and game timing."],
  ["6. Public Record", "Check Public Record to see pending picks, graded picks, wins, losses, pushes, ROI, and profit tracking."],
  ["7. PRO Upgrade", "PRO unlocks premium features after Stripe payment confirmation. Use the same email you used for your KBETZ account."],
  ["8. Responsible Use", "KBETZ is an analytics tool. No pick, parlay, hedge, or prediction is guaranteed. Only risk what you can afford to lose."],
];

export default function HowToUsePage() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="tag">KBETZ GUIDE</p>
          <h1>How to Use KBETZ</h1>
          <p className="sub">
            A simple guide for guests and PRO users. Learn how to read odds,
            use AI tools, check player data, and track results honestly.
          </p>
        </div>

        <div className="links">
          <a href="/dashboard">← Dashboard</a>
          <a href="/parlay">AI Parlay</a>
          <a href="/record">Public Record</a>
        </div>
      </section>

      <section className="trust">
        <strong>Trust First:</strong> KBETZ provides sports analytics, odds
        insights, and AI-assisted picks. No result is guaranteed. Use the data
        to make smarter decisions, not blind bets.
      </section>

      <section className="grid">
        {steps.map(([title, text]) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="tips">
        <h2>Quick Tips</h2>
        <p>
          Check the Public Record often. Treat AI picks as information, not
          promises. Use PRO tools responsibly and always manage your risk.
        </p>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          color: white;
          background:
            radial-gradient(circle at top left, rgba(0,255,214,.18), transparent 32%),
            radial-gradient(circle at top right, rgba(210,45,255,.22), transparent 30%),
            linear-gradient(135deg, #020707, #14051f, #030711);
          font-family: Arial, sans-serif;
        }

        .hero,
        .trust,
        .card,
        .tips {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 22px;
          box-shadow: 0 20px 70px rgba(0,0,0,.35);
          backdrop-filter: blur(12px);
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 26px;
          margin-bottom: 16px;
        }

        .tag {
          color: #67e8f9;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .18em;
          margin: 0 0 10px;
        }

        h1 {
          margin: 0;
          font-size: clamp(42px, 7vw, 76px);
          line-height: .95;
          background: linear-gradient(90deg, #fff, #d8b4fe, #67e8f9);
          -webkit-background-clip: text;
          color: transparent;
        }

        .sub,
        .card p,
        .tips p {
          color: rgba(255,255,255,.74);
          line-height: 1.6;
          font-weight: 700;
        }

        .links {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .links a {
          color: white;
          text-decoration: none;
          font-weight: 900;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.09);
        }

        .trust {
          padding: 16px;
          margin-bottom: 16px;
          line-height: 1.55;
          font-weight: 800;
          border-color: rgba(103,232,249,.24);
        }

        .trust strong {
          color: #67e8f9;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }

        .card,
        .tips {
          padding: 18px;
        }

        .card h2,
        .tips h2 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        @media (max-width: 1000px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .hero {
            flex-direction: column;
          }

          .grid {
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
