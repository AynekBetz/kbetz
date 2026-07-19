"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";

export default function MarketsTable({
  games,
  loading,
  hovered,
  setHovered,
  flash,
  styles,
  lineHistory,
  formatOdds,
  addToParlay,
}) {
  return (


      <section style={styles.marketPanel}>
        <div style={styles.marketHeader}>
          <div>
            <h2 style={styles.marketTitle}>LIVE MARKETS</h2>
            <p style={styles.featureSubtitle}>Real-time odds & AI edges</p>
          </div>

          <div style={styles.filterTabs}>
            <span style={styles.activeTab}>ALL</span>
            <span style={styles.tab}>NBA</span>
            <span style={styles.tab}>MLB</span>
            <span style={styles.tab}>NHL</span>
            <span style={styles.tab}>NFL</span>
            <span style={styles.tab}>NCAAB</span>
          </div>

          <div style={styles.liveOnly}>LIVE ONLY 🟢</div>
        </div>

        <div style={styles.tableHeader}>
          <span>GAME</span>
          <span>BOOKS</span>
          <span>BEST LINE</span>
          <span>AI EDGE</span>
          <span>LINE MOVEMENT</span>
          <span>ODDS HISTORY</span>
          <span>ACTION</span>
        </div>

        {loading && <div style={styles.emptyState}>Loading KBETZ live markets...</div>}

        {!loading && games.length === 0 && (
          <div style={styles.emptyState}>No live markets available right now.</div>
        )}

        {games.map((g, i) => {
          const moveText =
            g.movement === "up"
              ? "↑ line moving"
              : g.movement === "down"
              ? "↓ line moving"
              : "stable";

          return (
            <div
              key={g.key || i}
              onMouseEnter={() => setHovered(g.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...styles.marketRow,
                boxShadow:
                  hovered === g.key
                    ? "0 0 28px rgba(0,255,225,0.45)"
                    : flash[g.key] === "up"
                    ? "0 0 18px rgba(0,255,225,0.65)"
                    : flash[g.key] === "down"
                    ? "0 0 18px rgba(255,40,40,0.55)"
                    : flash[g.key] === "click"
                    ? "0 0 18px rgba(0,194,255,0.65)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.04)",
                transform:
                  hovered === g.key
                    ? "translateY(-2px) scale(1.01)"
                    : flash[g.key]
                    ? "scale(1.01)"
                    : "scale(1)",
              }}
            >
              <div style={styles.gameCell}>
                <span style={styles.liveDot}>● LIVE</span>
                <div>
                  <strong>{g.away}</strong>
                  <br />
                  <span>@ {g.home}</span>
                </div>
              </div>

              <div style={styles.booksCell}>
                {(g.books || [{ name: "DK" }, { name: "FD" }, { name: "MGM" }])
                  .slice(0, 3)
                  .map((b, idx) => (
                    <span key={idx} style={styles.bookBadge}>
                      {b.name?.slice(0, 2) || "BK"}
                    </span>
                  ))}
                <span style={styles.extraBooks}>+{Math.max((g.books?.length || 3) - 3, 0)}</span>
              </div>

              <div>
                <strong style={styles.edge}>{g.home}</strong>
                <br />
                <span style={styles.bestLine}>{formatOdds(g.homeOdds)}</span>
              </div>

              <div style={styles.edgeLarge}>+{Number(g.edge || 0).toFixed(2)}%</div>

              <div>
                <span style={g.movement === "down" ? styles.moveDown : styles.moveUp}>
                  {moveText}
                </span>
                <br />
                <span style={styles.smallMuted}>live</span>
              </div>

              <div style={styles.chartCell}>
                <ResponsiveContainer>
                  <LineChart data={lineHistory[g.key] || []}>
                    <Line dataKey="value" stroke="#00ffe1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <button style={styles.addBtn} onClick={() => addToParlay(g)}>
                + Add to Parlay
              </button>
            </div>
          );
        })}
      </section>
  );
}
