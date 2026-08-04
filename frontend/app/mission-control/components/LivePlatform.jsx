"use client";

import GlassCard from "../../../components/ui/GlassCard";
import MetricCard from "../../../components/ui/MetricCard";
import SectionHeader from "../../../components/ui/SectionHeader";

export default function LivePlatform({
  loading = false,
  gamesMonitored = 0,
  sportsActive = 0,
  oddsReady = 0,
  aiPicksReady = 0,
  provider = "Waiting",
  lastRefresh = "--",
}) {
  return (
    <GlassCard glow="mixed" style={{ marginBottom: 20 }}>
      <SectionHeader
        eyebrow="Platform"
        title="Live Platform"
        subtitle="Current operational statistics from the KBETZ platform"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Games Monitored"
          value={gamesMonitored}
          detail="Events currently loaded"
          loading={loading}
        />

        <MetricCard
          label="Sports Active"
          value={sportsActive}
          detail="Sports represented in the feed"
          accent="#c86cff"
          loading={loading}
        />

        <MetricCard
          label="Odds Ready"
          value={oddsReady}
          detail="Games with sportsbook prices"
          accent="#ffd166"
          loading={loading}
        />

        <MetricCard
          label="AI Picks Ready"
          value={aiPicksReady}
          detail="Markets eligible for AI analysis"
          accent="#00ff99"
          loading={loading}
        />

        <MetricCard
          label="Provider"
          value={provider}
          detail="Current data source"
          accent="#7ca8ff"
          loading={loading}
        />

        <MetricCard
          label="Last Refresh"
          value={lastRefresh}
          detail="Most recent successful sync"
          accent="#ff72d5"
          loading={loading}
        />
      </div>
    </GlassCard>
  );
}
