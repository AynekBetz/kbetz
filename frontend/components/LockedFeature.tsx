"use client";

export default function LockedFeature({ children }: any) {
  return (
    <div style={{ position: "relative" }}>
      {/* Blurred content */}
      <div style={{ filter: "blur(6px)", opacity: 0.5 }}>
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.6)",
          color: "#00ffc3",
          fontWeight: "bold",
          fontSize: "16px",
          borderRadius: "8px"
        }}
      >
        🔒 Upgrade to PRO
      </div>
    </div>
  );
}
