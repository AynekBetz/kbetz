"use client";

export default function ParlayBuilder({
  styles,
  parlay,
  payout,
  parlayOdds,
  clearParlay,
  isPro,
  upgrade,
}) {
  if (!isPro) {
    return (
      <section
        style={{
          ...styles.parlayWide,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={styles.sectionIcon}>🔒</div>

        <div>
          <h2 style={styles.featureTitle}>AI PARLAY BUILDER PRO</h2>
          <p style={styles.featureSubtitle}>
            Build premium multi-leg parlays with live odds and payout tracking.
          </p>
        </div>

        <div style={styles.verticalLine}></div>

        <div>
          <div style={styles.statLabel}>LOCKED FEATURES</div>
          <div style={styles.bigNumber}>AI PICKS</div>
        </div>

        <div style={styles.verticalLine}></div>

        <div>
          <div style={styles.statLabel}>ACCESS</div>
          <div style={styles.purpleOdds}>PRO</div>
        </div>

        <button style={styles.upgradeBtn} onClick={upgrade}>
          Upgrade to PRO
        </button>
      </section>
    );
  }

  return (
    <section style={styles.parlayWide}>
      <div style={styles.sectionIcon}>🧾</div>

      <div>
        <h2 style={styles.featureTitle}>PARLAY BUILDER</h2>
        <div style={styles.statLabel}>LEGS</div>
        <div style={styles.statValue}>{parlay.length}</div>
      </div>

      <div style={styles.verticalLine}></div>

      <div>
        <div style={styles.statLabel}>POTENTIAL PAYOUT</div>
        <div style={styles.bigNumber}>
          {payout}x{" "}
          <span style={styles.payoutSub}>
            (${(Number(payout) * 500).toFixed(2)})
          </span>
        </div>
      </div>

      <div style={styles.verticalLine}></div>

      <div>
        <div style={styles.statLabel}>PARLAY ODDS</div>
        <div style={styles.purpleOdds}>{parlayOdds}</div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "stretch",
        }}
      >
        <a
          href="/parlay"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 1000,
            fontSize: "12px",
            textAlign: "center",
            padding: "11px 14px",
            borderRadius: "999px",
            border: "1px solid rgba(103,232,249,.65)",
            background:
              "linear-gradient(90deg, rgba(124,58,237,.82), rgba(6,182,212,.82))",
            boxShadow:
              "0 0 24px rgba(103,232,249,.22), 0 0 18px rgba(210,45,255,.16)",
            whiteSpace: "nowrap",
          }}
        >
          ✨ READY-MADE AI PARLAYS
        </a>

        <button style={styles.clearBtn} onClick={clearParlay}>
          🗑 Clear Manual Parlay
        </button>
      </div>
    </section>
  );
}