"use client";

export default function LockedFeature({ children }: any) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(6px)", opacity: 0.4 }}>
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.75)",
          color: "#00ffc3",
          textAlign: "center",
          padding: "10px"
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
          🔒 PRO FEATURE
        </div>

        <div style={{ fontSize: "13px", marginTop: "6px" }}>
          +EV bets, arbitrage edges, and AI signals hidden
        </div>

        <div style={{ marginTop: "10px", fontWeight: "bold" }}>
          Unlock winning data now
        </div>
      </div>
    </div>
  );
}
