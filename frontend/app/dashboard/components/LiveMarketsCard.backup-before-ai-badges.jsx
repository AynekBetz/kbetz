"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";

export default function LiveMarketsCard({
  styles,
  games,
  lineHistory,
}) {
  return (
    <section style={styles.summaryCardTeal}>
      <div style={styles.sectionIcon}>📊</div>

      <div>
        <h2 style={styles.featureTitle}>LIVE MARKETS</h2>
        <p style={styles.featureSubtitle}>
          Real-time odds from multiple sportsbooks
        </p>
      </div>

      <div style={styles.marketMiniData}>
        <div>NBA</div>
        <strong>BOS 68</strong>
        <strong>MIA 61</strong>
        <span>Q3 6:42</span>
      </div>

      <div style={styles.marketMiniData}>
        <div>SPREAD</div>
        <strong>BOS -4.5</strong>
        <span>-110</span>
      </div>

      <div style={styles.marketMiniData}>
        <div>MONEYLINE</div>
        <strong>BOS -210</strong>
        <span>MIA +175</span>
      </div>

      <div style={styles.sparkLineLong}>
        <ResponsiveContainer>
          <LineChart data={(lineHistory[games[0]?.key] || []).slice(-24)}>
            <Line
              dataKey="value"
              stroke="#00ffe1"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.livePill}>● LIVE</div>
    </section>
  );
}
