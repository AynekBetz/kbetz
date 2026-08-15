"use client";

export default function SplitSummary({
  styles,
  arbOps,
  steamGames,
  isPro,
  upgrade,
}) {
  if (!isPro) {
    return (
      <section style={styles.splitSummary}>
        <div
          data-tour="arbitrage"
          style={{
            ...styles.summaryCardGreen,
            position: "relative",
            overflow: "hidden",
            opacity: 0.9,
          }}
        >
          <div style={styles.iconGreen}>🔒</div>

          <div>
            <h2 style={styles.featureTitle}>ARBITRAGE PRO</h2>
            <p style={styles.featureSubtitle}>
              Compare sportsbooks and uncover positive EV opportunities.
            </p>
          </div>

          <button
            style={styles.upgradeBtn}
            onClick={upgrade}
          >
            Upgrade to PRO
          </button>
        </div>

        <div
          data-tour="steam"
          style={{
            ...styles.summaryCardPurpleOrange,
            position: "relative",
            overflow: "hidden",
            opacity: 0.9,
          }}
        >
          <div style={styles.iconPurple}>🔒</div>

          <div>
            <h2 style={styles.featureTitle}>STEAM PRO</h2>
            <p style={styles.featureSubtitle}>
              Unlock sharp money movement and steam alerts.
            </p>
          </div>

          <button
            style={styles.upgradeBtn}
            onClick={upgrade}
          >
            Upgrade to PRO
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.splitSummary}>
      <div
        data-tour="arbitrage"
        style={styles.summaryCardGreen}
      >
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

      <div
        data-tour="steam"
        style={styles.summaryCardPurpleOrange}
      >
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