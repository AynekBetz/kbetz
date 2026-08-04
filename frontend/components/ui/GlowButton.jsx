"use client";

export default function GlowButton({
  children,
  onClick,
  disabled = false,
  color = "#00ffe1",
  type = "button",
  style = {},
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 12,
        border: `1px solid ${color}55`,
        background: `${color}14`,
        color,
        fontWeight: 800,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .2s ease",
        boxShadow: `0 0 16px ${color}22`,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 0 24px ${color}55`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `0 0 16px ${color}22`;
        }
      }}
    >
      {children}
    </button>
  );
}
