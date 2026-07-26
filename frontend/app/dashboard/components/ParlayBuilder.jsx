"use client";

export default function ParlayBuilder({
  styles,
  parlay,
  payout,
  parlayOdds,
  clearParlay,
}) {
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

      <button style={styles.clearBtn} onClick={clearParlay}>
        🗑 Clear Parlay
      </button>
    </section>
  );
}