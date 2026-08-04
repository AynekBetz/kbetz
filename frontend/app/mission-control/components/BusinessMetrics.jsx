"use client";

import GlassCard from "../../../components/ui/GlassCard";
import MetricCard from "../../../components/ui/MetricCard";
import SectionHeader from "../../../components/ui/SectionHeader";

export default function BusinessMetrics({
  loading = false,
  revenueToday = "--",
  monthlyRevenue = "--",
  lifetimeRevenue = "--",
  proMembers = "--",
  totalUsers = "--",
  conversionRate = "--",
}) {
  return (
    <GlassCard glow="mixed" style={{ marginBottom: 20 }}>
      <SectionHeader
        eyebrow="Business"
        title="Business Metrics"
        subtitle="Revenue and customer metrics from live platform data"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Revenue Today"
          value={revenueToday}
          detail="Today's completed payments"
          loading={loading}
          accent="#00ffe1"
        />

        <MetricCard
          label="Monthly Revenue"
          value={monthlyRevenue}
          detail="Current month's revenue"
          loading={loading}
          accent="#7ca8ff"
        />

        <MetricCard
          label="Lifetime Revenue"
          value={lifetimeRevenue}
          detail="All completed payments"
          loading={loading}
          accent="#ffd166"
        />

        <MetricCard
          label="PRO Members"
          value={proMembers}
          detail="Active paid subscribers"
          loading={loading}
          accent="#00ff99"
        />

        <MetricCard
          label="Total Users"
          value={totalUsers}
          detail="Registered KBETZ users"
          loading={loading}
          accent="#ff72d5"
        />

        <MetricCard
          label="Conversion Rate"
          value={conversionRate}
          detail="Visitor → PRO conversion"
          loading={loading}
          accent="#c86cff"
        />
      </div>
    </GlassCard>
  );
}
