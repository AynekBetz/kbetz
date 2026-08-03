"use client";

function cleanSport(game) {
  return String(game?.sport || game?.league || "SPORT")
    .trim()
    .toUpperCase();
}

export default function AIPicks({
  topAiPicks = [],
  games = [],
  styles,
  formatOdds,
  handleViewPick,
}) {
  const realPicks = topAiPicks
    .filter(
      (game) =>
        game?.hasOdds === true &&
        Number.isFinite(Number(game?.homeOdds)) &&
        Number.isFinite(Number(game?.confidence)) &&
        Number.isFinite(Number(game?.edge)) &&
        Number(game?.confidence) > 0 &&
        Array.isArray(game?.books) &&
        game.books.length > 0
    )
    .sort((a, b) => {
      const confidenceDifference =
        Number(b.confidence || 0) - Number(a.confidence || 0);

      if (confidenceDifference !== 0) {
        return confidenceDifference;
      }

      return Number(b.edge || 0) - Number(a.edge || 0);
    })
    .slice(0, 3);

  const scheduleCount = Array.isArray(games) ? games.length : 0;

  const oddsReadyCount = games.filter(
    (game) =>
      game?.hasOdds === true &&
      Number.isFinite(Number(game?.homeOdds))
  ).length;

  const sportsCount = new Set(
    games.map((game) => cleanSport(game)).filter(Boolean)
  ).size;

  const provider =
    games.find((game) => game?.provider)?.provider ||
    (games.some((game) => game?.source === "api-sports")
      ? "API-Sports"
      : "Connected providers");

  return (
    <section style={styles.aiWideCard}>
      <div style={styles.iconPink}>🧠</div>

      <div>
        <h2 style={styles.featureTitle}>AI MARKET INTELLIGENCE</h2>

        <p style={styles.featureSubtitle}>
          KBETZ analyzes only genuine sportsbook prices and connected market
          data
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
                gap: 8,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  flexWrap: "wrap",
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
                  {cleanSport(game)} · VERIFIED MARKET
                </span>

                <span
                  style={{
                    border: "1px solid rgba(0,255,136,.35)",
                    borderRadius: 999,
                    padding: "4px 8px",
                    color: "#00ff88",
                    fontSize: 10,
                    fontWeight: 1000,
                  }}
                >
                  ODDS LIVE
                </span>
              </div>

              <strong style={{ color: "#ffffff", fontSize: 16 }}>
                {game.home} {formatOdds?.(game.homeOdds)}
              </strong>

              <span
                style={{
                  color: "rgba(255,255,255,.57)",
                  fontSize: 12,
                }}
              >
                {game.away} at {game.home}
              </span>

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
                  Books: {game.books.length}
                </span>
              </div>

              <button
                type="button"
                style={styles.smallViewBtn}
                onClick={() => handleViewPick?.(game)}
              >
                View Market Analysis
              </button>
            </div>
          ))
        ) : (
          <div
            style={{
              border: "1px solid rgba(209,45,255,.22)",
              borderRadius: 16,
              padding: 18,
              background:
                "linear-gradient(145deg, rgba(0,255,214,.045), rgba(209,45,255,.06))",
              boxShadow: "inset 0 0 22px rgba(209,45,255,.035)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong
                  style={{
                    display: "block",
                    color: "#ffffff",
                    marginBottom: 7,
                    fontSize: 16,
                  }}
                >
                  KBETZ Intelligence Engine is monitoring the board
                </strong>

                <span
                  style={{
                    color: "rgba(255,255,255,.63)",
                    fontSize: 13,
                    lineHeight: 1.65,
                  }}
                >
                  Real schedules are available now. Picks, confidence scores,
                  and betting edges will activate automatically when genuine
                  sportsbook prices are available.
                </span>
              </div>

              <span
                style={{
                  border: "1px solid rgba(255,196,61,.38)",
                  borderRadius: 999,
                  padding: "6px 10px",
                  color: "#ffd66b",
                  fontSize: 10,
                  fontWeight: 1000,
                }}
              >
                WAITING FOR ODDS
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <div
                style={{
                  border: "1px solid rgba(0,255,214,.2)",
                  borderRadius: 12,
                  padding: 11,
                  background: "rgba(0,255,214,.04)",
                }}
              >
                <div
                  style={{
                    color: "rgba(255,255,255,.55)",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1,
                  }}
                >
                  GAMES MONITORED
                </div>

                <strong
                  style={{
                    display: "block",
                    color: "#00ffd6",
                    fontSize: 21,
                    marginTop: 4,
                  }}
                >
                  {scheduleCount}
                </strong>
              </div>

              <div
                style={{
                  border: "1px solid rgba(209,45,255,.2)",
                  borderRadius: 12,
                  padding: 11,
                  background: "rgba(209,45,255,.04)",
                }}
              >
                <div
                  style={{
                    color: "rgba(255,255,255,.55)",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1,
                  }}
                >
                  SPORTS ACTIVE
                </div>

                <strong
                  style={{
                    display: "block",
                    color: "#f0b8ff",
                    fontSize: 21,
                    marginTop: 4,
                  }}
                >
                  {sportsCount}
                </strong>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,196,61,.2)",
                  borderRadius: 12,
                  padding: 11,
                  background: "rgba(255,196,61,.04)",
                }}
              >
                <div
                  style={{
                    color: "rgba(255,255,255,.55)",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1,
                  }}
                >
                  ODDS READY
                </div>

                <strong
                  style={{
                    display: "block",
                    color: oddsReadyCount > 0 ? "#00ff88" : "#ffd66b",
                    fontSize: 21,
                    marginTop: 4,
                  }}
                >
                  {oddsReadyCount}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: 13,
                color: "rgba(255,255,255,.5)",
                fontSize: 11,
              }}
            >
              Current schedule provider: {provider}
            </div>
          </div>
        )}
      </div>

      <div style={styles.brainArt}></div>
    </section>
  );
}
