"use client";

import GlassCard from "../../../components/ui/GlassCard";
import MetricCard from "../../../components/ui/MetricCard";
import SectionHeader from "../../../components/ui/SectionHeader";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function IntelligenceCenter({
  gamesMonitored = 0,
  oddsReady = 0,
  aiPicksReady = 0,
  steamAlerts = 0,
  arbitrageReady = 0,
  loading = false,
}) {
  const aiOnline = aiPicksReady > 0;
  const marketOnline = oddsReady > 0;

  return (
    <GlassCard glow="mixed" style={{ marginBottom: 20 }}>
      <SectionHeader
        eyebrow="Intelligence"
        title="AI Operations Center"
        subtitle="Verified market readiness and analysis activity"
        action={
          <StatusBadge
            label={aiOnline ? "AI Analysis Active" : "Waiting for Odds"}
            status={aiOnline ? "online" : "warning"}
          />
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <MetricCard
          label="Games Watched"
          value={gamesMonitored}
          detail="Real events monitored by KBETZ"
          loading={loading}
        />

        <MetricCard
          label="Markets Ready"
          value={oddsReady}
          detail="Games with genuine sportsbook prices"
          accent="#ffd166"
          loading={loading}
        />

        <MetricCard
          label="AI Picks Ready"
          value={aiPicksReady}
          detail="Markets eligible for verified analysis"
          accent="#00ff99"
          loading={loading}
        />

        <MetricCard
          label="Steam Alerts"
          value={steamAlerts}
          detail="Confirmed line-movement alerts"
          accent="#ff72d5"
          loading={loading}
        />

        <MetricCard
          label="Arbitrage Ready"
          value={arbitrageReady}
          detail="Verified cross-book opportunities"
          accent="#7ca8ff"
          loading={loading}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "Schedule Engine",
            value: gamesMonitored
              ? `Monitoring ${gamesMonitored} real events`
              : "Waiting for schedules",
            online: gamesMonitored > 0,
          },
          {
            label: "Sportsbook Analysis",
            value: marketOnline
              ? `${oddsReady} markets ready`
              : "Paused until real odds arrive",
            online: marketOnline,
          },
          {
            label: "AI Recommendations",
            value: aiOnline
              ? `${aiPicksReady} verified picks ready`
              : "No eligible markets yet",
            online: aiOnline,
          },
          {
            label: "Fake-Data Protection",
            value: "Enabled",
            online: true,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 14,
              padding: 15,
              background: "rgba(255,255,255,.025)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <strong
                style={{
                  color: "#ffffff",
                  fontSize: 13,
                }}
              >
                {item.label}
              </strong>

              <StatusBadge
                label={item.online ? "Active" : "Standby"}
                status={item.online ? "online" : "warning"}
              />
            </div>

            <div
              style={{
                marginTop: 9,
                color: "rgba(255,255,255,.52)",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
