export default function LowerGrid({
  styles,
  arbOps,
  steamGames,
  history,
  formatOdds,
}) {
  return (
    <section style={styles.lowerGrid}>
      <div style={styles.lowerCardGreen}>
        <h2>ARBITRAGE</h2>

        {arbOps.length === 0 ? (
          <div style={styles.mutedLine}>0 opportunities</div>
        ) : (
          arbOps.map((g, i) => (
            <div key={i} style={styles.lowerRow}>
              <span>{g.away} @ {g.home}</span>
              <strong>+{g.arbEdge}%</strong>
            </div>
          ))
        )}
      </div>

      <div style={styles.lowerCardOrange}>
        <h2>STEAM</h2>

        {steamGames.length === 0 ? (
          <div style={styles.mutedLine}>0 games</div>
        ) : (
          steamGames.map((g, i) => (
            <div key={i} style={styles.lowerRow}>
              <span>{g.away} @ {g.home}</span>
              <strong>↑ {g.strength}%</strong>
            </div>
          ))
        )}
      </div>

      <div style={styles.lowerCardPurple}>
        <h2>HISTORY</h2>

        {history.length === 0 ? (
          <div style={styles.mutedLine}>0 bets</div>
        ) : (
          history.map((h, i) => (
            <div key={i} style={styles.lowerRow}>
              <span>{h.home}</span>
              <strong>{formatOdds(h.homeOdds)}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}