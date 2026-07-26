export default function HistoryPanel({
  styles,
  history,
  handleViewHistory,
}) {
  return (
    <section style={styles.historyWide}>
      <div style={styles.iconPurple}>↺</div>

      <div>
        <h2 style={styles.featureTitle}>HISTORY</h2>
        <p style={styles.featureSubtitle}>Your recent bets & results</p>
      </div>

      <div style={styles.historyStat}>
        <span>TODAY</span>
        <strong>5-2</strong>
        <em>+2.35u</em>
      </div>

      <div style={styles.historyStat}>
        <span>THIS WEEK</span>
        <strong>19-8</strong>
        <em>+7.84u</em>
      </div>

      <div style={styles.historyStat}>
        <span>THIS MONTH</span>
        <strong>67-28</strong>
        <em>+18.47u</em>
      </div>

      <button
        style={styles.historyBtn}
        onClick={handleViewHistory}
      >
        View History
      </button>

      <div style={styles.rightBadgePurple}>
        {history.length} BETS
      </div>
    </section>
  );
}