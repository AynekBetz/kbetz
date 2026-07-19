"use client";

export default function AIPicks({
  topAiPicks,
  styles,
  formatOdds,
  handleViewPick,
}) {
  return (
    <section style={styles.aiWideCard}>
      <div style={styles.iconPink}>🧠</div>

      <div>
        <h2 style={styles.featureTitle}>AI PICKS</h2>
        <p style={styles.featureSubtitle}>
          Top AI generated edges in real-time
        </p>
      </div>

      <div style={styles.aiPickList}>
        {topAiPicks.length ? (
          topAiPicks.map((g, i) => (
            <div key={i} style={styles.aiMiniRow}>
              <span>
                {g.home} {formatOdds(g.homeOdds)}
              </span>

              <span style={styles.confidence}>
                EDGE {g.edge.toFixed(1)}%
              </span>

              <button
                style={styles.smallViewBtn}
                onClick={() => handleViewPick(g)}
              >
                View Pick
              </button>
            </div>
          ))
        ) : (
          <div style={styles.mutedLine}>
            AI engine is scanning live edges...
          </div>
        )}
      </div>

      <div style={styles.brainArt}></div>
    </section>
  );
}
