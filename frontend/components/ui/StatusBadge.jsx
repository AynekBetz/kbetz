"use client";

export default function StatusBadge({
  label,
  status = "neutral",
  dot = true,
  style = {},
}) {
  const variants = {
    online: {
      color: "#00ff99",
      border: "rgba(0,255,153,.35)",
      background: "rgba(0,255,153,.07)",
    },
    warning: {
      color: "#ffd166",
      border: "rgba(255,209,102,.35)",
      background: "rgba(255,209,102,.07)",
    },
    offline: {
      color: "#ff5f73",
      border: "rgba(255,95,115,.35)",
      background: "rgba(255,95,115,.07)",
    },
    info: {
      color: "#7ca8ff",
      border: "rgba(124,168,255,.35)",
      background: "rgba(124,168,255,.07)",
    },
    neutral: {
      color: "rgba(255,255,255,.72)",
      border: "rgba(255,255,255,.15)",
      background: "rgba(255,255,255,.045)",
    },
  };

  const selected = variants[status] || variants.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        width: "fit-content",
        border: `1px solid ${selected.border}`,
        borderRadius: 999,
        padding: "7px 10px",
        background: selected.background,
        color: selected.color,
        fontSize: 10,
        fontWeight: 1000,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot ? (
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: selected.color,
            boxShadow: `0 0 12px ${selected.color}`,
            flexShrink: 0,
          }}
        />
      ) : null}

      {label}
    </span>
  );
}
