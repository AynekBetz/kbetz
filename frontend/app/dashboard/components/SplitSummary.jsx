"use client";

export default function SplitSummary({ styles, arbOps, steamGames }) {
  return (
    <section style={styles.splitSummary}>
      <div style={styles.summaryCardGreen}>
        <div style={styles.iconGreen}>$</div>

        <div>
          <h2 style={styles.featureTitle}>ARBITRAGE</h2>
          <p style={styles.featureSubtitle}>Positive EV across books</p>
        </div>

        <div style={styles.rightBadgeGreen}>
          {arbOps.length}
          <span>OPPORTUNITIES</span>
        </div>
      </div>

      <div style={styles.summaryCardPurpleOrange}>
        <div style={styles.iconPurple}>🔥</div>

        <div>
          <h2 style={styles.featureTitle}>STEAM</h2>
          <p style={styles.featureSubtitle}>Sharp money & line movement</p>
        </div>

        <div style={styles.rightBadgePurple}>
          {steamGames.length}
          <span>GAMES</span>
        </div>
      </div>
    </section>
  );
}