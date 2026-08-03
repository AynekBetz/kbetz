"use client";

export default function AIPicks({
  topAiPicks = [],
  styles,
  formatOdds,
  handleViewPick,
}) {
  const realPicks = topAiPicks
    .filter(
      (game) =>
        game?.hasOdds === true &&
        Number.isFinite(Number(game?.homeOdds)) &&
        Number(game?.confidence || 0) > 0
    )
    .slice(0, 3);

  return (
    <section style={styles.aiWideCard}>
      <div style={styles.iconPink}>🧠</div>

      <div>
        <h2 style={styles.featureTitle}>AI PICKS</h2>
        <p style={styles.featureSubtitle}>
          Analysis activates only when genuine sportsbook prices are available
        </p>
      </div>

      <div style={styles.aiPickList}>
        {realPicks.length ? (
          realPicks.map((game, index) => (
            <div
              key={game.id || index}
              style={{
                ...styles.aiMiniRow,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 7,
                padding: 13,
              }}
            >
              <span
                style={{
                  color: "#f0b8ff",
                  fontSize: 11,
                  fontWeight: 1000,
                  letterSpacing: 1,
                }}
              >
                {game.sport || game.league || "SPORT"} · AI MARKET PICK
              </span>

              <strong style={{ color: "#ffffff", fontSize: 16 }}>
                {game.home} {formatOdds?.(game.homeOdds)}
              </strong>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#00ffe1" }}>
                  Confidence: {Math.round(Number(game.confidence || 0))}%
                </span>

                <span style={{ color: "#7df9ff" }}>
                  Edge: {Number(game.edge || 0).toFixed(1)}%
                </span>

                <span style={{ color: "#ffd966" }}>
                  Risk: {game.riskLevel || "Review"}
                </span>
              </div>

              <button
                style={styles.smallViewBtn}
                onClick={() => handleViewPick?.(game)}
              >
                View Analysis
              </button>
            </div>
          ))
        ) : (
          <div
            style={{
              border: "1px solid rgba(209,45,255,.2)",
              borderRadius: 14,
              padding: 18,
              background: "rgba(209,45,255,.045)",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#ffffff",
                marginBottom: 7,
                fontSize: 15,
              }}
            >
              Real schedules are loaded
            </strong>

            <span
              style={{
                color: "rgba(255,255,255,.63)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              KBETZ is waiting for genuine sportsbook odds before publishing AI
              picks, confidence scores, or betting edges.
            </span>
          </div>
        )}
      </div>

      <div style={styles.brainArt}></div>
    </section>
  );
}
