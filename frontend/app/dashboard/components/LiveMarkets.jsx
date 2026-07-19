"use client";

export default function LiveMarkets({
  games,
  styles,
  formatOdds,
  handleGameClick,
}) {
  return (
    <section style={styles.marketCard}>
      <h2 style={styles.featureTitle}>LIVE MARKETS</h2>

      {games.length ? (
        games.map((game, i) => (
          <div
            key={i}
            style={styles.marketRow}
            onClick={() => handleGameClick(game)}
          >
            <div>
              <strong>{game.away}</strong> @ <strong>{game.home}</strong>
            </div>

            <div style={styles.marketOdds}>
              {formatOdds(game.homeOdds)}
            </div>
          </div>
        ))
      ) : (
        <div style={styles.mutedLine}>
          Loading live markets...
        </div>
      )}
    </section>
  );
}
