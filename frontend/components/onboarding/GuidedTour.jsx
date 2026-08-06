"use client";

import GlassCard from "../ui/GlassCard";
import GlowButton from "../ui/GlowButton";

export default function GuidedTour({
  open = false,
  currentStep = {},
  stepIndex = 0,
  totalSteps = 0,
  onNext,
  onPrevious,
  onSkip,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,.72)",
        backdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: 24,
      }}
    >
      <GlassCard
        glow="mixed"
        hover={false}
        style={{
          width: 430,
          maxWidth: "100%",
          padding: 28,
          border: "1px solid rgba(0,255,225,.28)",
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            margin: "0 auto 20px",
            display: "grid",
            placeItems: "center",
            fontSize: 34,
            fontWeight: 900,
            color: "#fff",
            background:
              "linear-gradient(135deg,#00ffe1,#7c3aed,#ff49d8)",
          }}
        >
          LK
        </div>

        <h2
          style={{
            color: "#fff",
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          {currentStep.title || "Welcome"}
        </h2>

        <p
          style={{
            color: "rgba(255,255,255,.75)",
            lineHeight: 1.7,
            textAlign: "center",
            minHeight: 120,
          }}
        >
          {currentStep.description ||
            "Le'kenya will guide you through KBETZ one step at a time."}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 22,
          }}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background:
                  i === stepIndex
                    ? "#00ffe1"
                    : "rgba(255,255,255,.18)",
                boxShadow:
                  i === stepIndex
                    ? "0 0 10px #00ffe1"
                    : "none",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            onClick={onPrevious}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.15)",
              background: "rgba(255,255,255,.05)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ← Previous
          </button>

          <GlowButton
            onClick={onNext}
            color="#00ffe1"
            style={{ flex: 1 }}
          >
            {stepIndex + 1 === totalSteps
              ? "Enter KBETZ"
              : "Next →"}
          </GlowButton>
        </div>

        <button
          onClick={onSkip}
          style={{
            marginTop: 18,
            width: "100%",
            background: "transparent",
            border: "none",
            color: "#8aa0b7",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Skip Tour
        </button>
      </GlassCard>
    </div>
  );
}
