"use client";

export default function GlassCard({
  children,
  style = {},
  glow = "teal",
  hover = true,
  as: Component = "section",
  ...props
}) {
  const glowStyles = {
    teal: {
      border: "rgba(0,255,225,.22)",
      shadow: "rgba(0,255,225,.08)",
    },
    violet: {
      border: "rgba(196,45,255,.24)",
      shadow: "rgba(196,45,255,.09)",
    },
    mixed: {
      border: "rgba(124,92,255,.25)",
      shadow: "rgba(0,255,225,.07)",
    },
    neutral: {
      border: "rgba(255,255,255,.1)",
      shadow: "rgba(255,255,255,.035)",
    },
  };

  const selectedGlow = glowStyles[glow] || glowStyles.teal;

  return (
    <Component
      {...props}
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${selectedGlow.border}`,
        borderRadius: 20,
        padding: 20,
        background:
          "linear-gradient(145deg, rgba(4,18,23,.91), rgba(15,6,28,.87))",
        boxShadow: `
          0 0 32px ${selectedGlow.shadow},
          inset 0 0 24px rgba(255,255,255,.025)
        `,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        transition: hover
          ? "transform .2s ease, border-color .2s ease, box-shadow .2s ease"
          : "none",
        ...style,
      }}
      onMouseEnter={(event) => {
        if (hover) {
          event.currentTarget.style.transform = "translateY(-2px)";
          event.currentTarget.style.boxShadow = `
            0 10px 34px ${selectedGlow.shadow},
            inset 0 0 24px rgba(255,255,255,.035)
          `;
        }

        props.onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        if (hover) {
          event.currentTarget.style.transform = "translateY(0)";
          event.currentTarget.style.boxShadow = `
            0 0 32px ${selectedGlow.shadow},
            inset 0 0 24px rgba(255,255,255,.025)
          `;
        }

        props.onMouseLeave?.(event);
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at top left, rgba(0,255,225,.055), transparent 34%), radial-gradient(circle at bottom right, rgba(196,45,255,.055), transparent 38%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </Component>
  );
}
