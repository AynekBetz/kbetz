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
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: 24,
        pointerEvents: "none",
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
          pointerEvents: "auto",
          boxShadow:
            "0 0 45px rgba(0,255,225,.12), 0 0 70px rgba(124,58,237,.12)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 170,
            height: 190,
            margin: "0 auto 18px",
            overflow: "hidden",
            borderRadius: 22,
            border: "1px solid rgba(0,255,225,.34)",
            background:
              "radial-gradient(circle at 30% 20%, rgba(0,255,225,.24), transparent 38%), radial-gradient(circle at 75% 35%, rgba(124,58,237,.22), transparent 42%), #03070c",
            boxShadow:
              "0 0 26px rgba(0,255,225,.18), 0 0 45px rgba(124,58,237,.16)",
          }}
        >
          {currentStep?.videoSrc ? (
            <video
              key={currentStep.videoSrc}
              src={currentStep.videoSrc}
              autoPlay
              muted
              playsInline
              loop
              preload="metadata"
              aria-label="Le'kenya, your KBETZ AI Guide"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />
          ) : (
            <img
              src="/lekenya-kbetz-portrait.png"
              alt="Le'kenya, your KBETZ AI Guide"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                filter:
                  "saturate(1.08) contrast(1.03) drop-shadow(0 0 18px rgba(0,255,225,.18))",
              }}
            />
          )}
        </div>

        <h2
          style={{
            textAlign: "center",
            marginBottom: 14,
            fontWeight: 1000,
            background:
              "linear-gradient(90deg, #00ffe1 0%, #35d7ff 30%, #7c6cff 64%, #d946ef 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 22px rgba(0,255,225,.12)",
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
            type="button"
            onClick={onPrevious}
            disabled={stepIndex <= 0}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.15)",
              background:
                stepIndex <= 0
                  ? "rgba(255,255,255,.025)"
                  : "rgba(255,255,255,.05)",
              color:
                stepIndex <= 0
                  ? "rgba(255,255,255,.28)"
                  : "#ffffff",
              cursor: stepIndex <= 0 ? "not-allowed" : "pointer",
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
