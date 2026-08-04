"use client";

import GlassCard from "../../../components/ui/GlassCard";
import SectionHeader from "../../../components/ui/SectionHeader";
import StatusBadge from "../../../components/ui/StatusBadge";

export default function SystemHealth({
  frontendOnline = true,
  backendOnline = false,
  mongoOnline = false,
  stripeOnline = true,
  apiSportsOnline = false,
  oddsProviderOnline = false,
}) {
  const services = [
    {
      name: "Frontend",
      online: frontendOnline,
      onlineLabel: "Online",
      offlineLabel: "Offline",
    },
    {
      name: "Backend",
      online: backendOnline,
      onlineLabel: "Online",
      offlineLabel: "Unavailable",
    },
    {
      name: "MongoDB",
      online: mongoOnline,
      onlineLabel: "Connected",
      offlineLabel: "Disconnected",
    },
    {
      name: "Stripe",
      online: stripeOnline,
      onlineLabel: "Live",
      offlineLabel: "Offline",
    },
    {
      name: "API-Sports",
      online: apiSportsOnline,
      onlineLabel: "Active",
      offlineLabel: "Standby",
    },
    {
      name: "Odds Provider",
      online: oddsProviderOnline,
      onlineLabel: "Healthy",
      offlineLabel: "Waiting",
    },
  ];

  return (
    <GlassCard glow="mixed" style={{ marginBottom: 20 }}>
      <SectionHeader
        eyebrow="Platform"
        title="System Health"
        subtitle="Current status of KBETZ platform services"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
        }}
      >
        {services.map((service) => (
          <div
            key={service.name}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 14,
              padding: 16,
              background: "rgba(255,255,255,.03)",
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
                  fontSize: 14,
                }}
              >
                {service.name}
              </strong>

              <StatusBadge
                label={
                  service.online
                    ? service.onlineLabel
                    : service.offlineLabel
                }
                status={service.online ? "online" : "warning"}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
