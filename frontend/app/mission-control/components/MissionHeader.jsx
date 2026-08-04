"use client";

import GlassCard from "../../../components/ui/GlassCard";
import GlowButton from "../../../components/ui/GlowButton";
import SectionHeader from "../../../components/ui/SectionHeader";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function MissionHeader({
  currentTime,
  refreshing = false,
  platformOnline = false,
  onRefresh,
}) {
  const dateLabel = currentTime
    ? currentTime.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Loading date...";

  const timeLabel = currentTime
    ? currentTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <GlassCard
      glow="mixed"
      hover={false}
      style={{
        marginBottom: 20,
        padding: "clamp(20px, 3vw, 30px)",
      }}
    >
      <SectionHeader
        eyebrow="KBETZ Operations"
        title="Mission Control"
        subtitle="Real platform health, sports coverage, and intelligence readiness"
        action={
          <StatusBadge
            label={platformOnline ? "Platform Online" : "Platform Checking"}
            status={platformOnline ? "online" : "warning"}
          />
        }
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 18,
          flexWrap: "wrap",
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div>
          <div
            style={{
              color: "#ffffff",
              fontSize: "clamp(27px, 4vw, 42px)",
              fontWeight: 1000,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              textShadow:
                "0 0 18px rgba(0,255,225,.35), 0 0 28px rgba(196,45,255,.2)",
            }}
          >
            {timeLabel}
          </div>

          <div
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,.56)",
              fontSize: 13,
            }}
          >
            {dateLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,.5)",
              fontSize: 11,
              lineHeight: 1.6,
              textAlign: "right",
            }}
          >
            <div>Environment: Production</div>
            <div>Branch: launch-candidate</div>
          </div>

          <GlowButton
            onClick={onRefresh}
            disabled={refreshing}
            color="#00ffe1"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Platform"}
          </GlowButton>
        </div>
      </div>
    </GlassCard>
  );
}
