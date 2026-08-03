"use client";

const ICONS = {
  BASEBALL: "⚾",
  BASKETBALL: "🏀",
  SOCCER: "⚽",
  HOCKEY: "🏒",
  FOOTBALL: "🏈",
  NFL: "🏈",
  NBA: "🏀",
  WNBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  TENNIS: "🎾",
  GOLF: "⛳",
};

export default function LiveMarketsSummary({
  styles,
  games = [],
}) {
  const counts = games.reduce((result, game) => {
    const sport = String(game?.sport || game?.league || "SPORT").toUpperCase();
    result[sport] = (result[sport] || 0) + 1;
    return result;
  }, {});

  const sports = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const gamesWithOdds = games.filter(
    (game) =>
      game?.hasOdds === true &&
      Number.isFinite(Number(game?.homeOdds))
  ).length;

  const provider =
    games.find((game) => game?.provider)?.provider ||
    (games.some((game) => game?.source === "api-sports")
      ? "API-Sports"
      : "Waiting for provider");

  return (
    <section style={styles.summaryCardTeal}>
      <div style={styles.sectionIcon}>📊</div>

      <div>
        <h2 style={styles.featureTitle}>TODAY&apos;S SPORTS</h2>
        <p style={styles.featureSubtitle}>
          Real schedules and available sportsbook markets
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(115px, 1fr))",
          gap: 10,
          marginTop: 15,
        }}
      >
        {sports.length ? (
          sports.map(([sport, count]) => (
            <div
              key={sport}
              style={{
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 13,
                padding: 11,
                background: "rgba(255,255,255,.035)",
              }}
            >
              <div style={{ fontSize: 18 }}>
                {ICONS[sport] || "🏟️"}
              </div>

              <strong
                style={{
                  display: "block",
                  color: "#ffffff",
                  marginTop: 4,
                  fontSize: 13,
                }}
              >
                {sport}
              </strong>

              <span
                style={{
                  color: "#00ffd6",
                  fontWeight: 1000,
                  fontSize: 17,
                }}
              >
                {count}
              </span>
            </div>
          ))
        ) : (
          <div style={{ color: "rgba(255,255,255,.6)" }}>
            Waiting for current games...
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 9,
        }}
      >
        <span
          style={{
            border: "1px solid rgba(0,255,214,.33)",
            borderRadius: 999,
            padding: "7px 10px",
            color: "#00ffd6",
            fontWeight: 900,
            fontSize: 11,
          }}
        >
          {games.length} GAMES
        </span>

        <span
          style={{
            border: "1px solid rgba(0,255,136,.3)",
            borderRadius: 999,
            padding: "7px 10px",
            color: "#00ff88",
            fontWeight: 900,
            fontSize: 11,
          }}
        >
          {gamesWithOdds} WITH ODDS
        </span>

        <span
          style={{
            border: "1px solid rgba(209,45,255,.32)",
            borderRadius: 999,
            padding: "7px 10px",
            color: "#f0b8ff",
            fontWeight: 900,
            fontSize: 11,
          }}
        >
          PROVIDER: {provider}
        </span>
      </div>
    </section>
  );
}
