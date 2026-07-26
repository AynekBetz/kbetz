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
            <div
              key={i}
              style={{
                ...styles.aiMiniRow,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "6px",
                padding: "12px",
              }}
            >
              <strong style={{ color: "#ffffff", fontSize: "16px" }}>
                {g.home} {formatOdds(g.homeOdds)}
              </strong>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#00ffe1" }}>
                  Confidence: {Math.round(g.confidence ?? 0)}%
                </span>

                <span style={{ color: "#7df9ff" }}>
                  Edge: {g.edge.toFixed(1)}%
                </span>

                <span
                  style={{
                    color:
                      g.riskLevel === "LOW"
                        ? "#4cff7a"
                        : g.riskLevel === "HIGH"
                        ? "#ff6565"
                        : "#ffd966",
                  }}
                >
                  Risk: {g.riskLevel ?? "N/A"}
                </span>
              </div>

              <button
                style={styles.smallViewBtn}
                onClick={() => handleViewPick(g)}
              >
                View Analysis
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