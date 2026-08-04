"use client";

import GlassCard from "./GlassCard";

export default function MetricCard({
  label,
  value,
  detail = "",
  accent = "#00ffe1",
  loading = false,
  style = {},
}) {
  return (
    <GlassCard glow="mixed" style={style}>
      <div
        style={{
          color: "rgba(255,255,255,.55)",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 10,
          color: accent,
          fontSize: 30,
          fontWeight: 1000,
          lineHeight: 1.1,
          textShadow: `0 0 18px ${accent}55`,
          wordBreak: "break-word",
        }}
      >
        {loading ? "..." : value}
      </div>

      {detail ? (
        <div
          style={{
            marginTop: 10,
            color: "rgba(255,255,255,.45)",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {detail}
        </div>
      ) : null}
    </GlassCard>
  );
}
