"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
const [user, setUser] = useState(null);

const isPro = user?.plan === "pro";

useEffect(() => {
const stored = localStorage.getItem("user");
if (stored) {
setUser(JSON.parse(stored));
}
}, []);

const logout = () => {
localStorage.removeItem("user");
window.location.href = "/login";
};

return (
<div
style={{
background: "#050505",
minHeight: "100vh",
color: "white",
padding: "20px",
fontFamily: "Inter, sans-serif",
}}
>
{/* HEADER */}
<div
style={{
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "25px",
}}
>
<h1
style={{
fontSize: "28px",
background: "linear-gradient(90deg, #a855f7, #22c55e)",
WebkitBackgroundClip: "text",
color: "transparent",
}}
>
KBETZ TERMINAL </h1>

```
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        onClick={() => (window.location.href = "/signup")}
        style={{
          background: "linear-gradient(90deg, gold, orange)",
          padding: "10px 18px",
          borderRadius: "8px",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Upgrade PRO
      </button>

      <button onClick={logout}>Logout</button>
    </div>
  </div>

  {/* ALERT */}
  <div style={{ marginBottom: "20px" }}>
    <div
      style={{
        background: "#111",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #222",
      }}
    >
      🚨 Market movement detected
    </div>
  </div>

  {/* AI PICKS */}
  <div
    style={{
      background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
      padding: "20px",
      borderRadius: "16px",
      marginBottom: "20px",
      boxShadow: "0 0 20px rgba(168,85,247,0.3)",
    }}
  >
    <h2>🧠 AI PICKS</h2>

    <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
      <div style={{ marginBottom: "10px" }}>
        Warriors @ Lakers
        <div style={{ color: "#22c55e" }}>EV: 6.30</div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        Heat @ Celtics
        <div style={{ color: "#22c55e" }}>EV: 6.15</div>
      </div>
    </div>

    {!isPro && (
      <p style={{ color: "gold", marginTop: "10px" }}>
        🔒 Upgrade to PRO to unlock AI Picks
      </p>
    )}
  </div>

  {/* AI PARLAY */}
  <div
    style={{
      background: "#0a0a0a",
      padding: "15px",
      borderRadius: "12px",
      marginBottom: "20px",
    }}
  >
    <h2>🎯 AI PARLAY</h2>

    <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
      <div>Warriors @ Lakers</div>
      <div>Heat @ Celtics</div>
      <div style={{ color: "#22c55e" }}>Odds: +272.73</div>
    </div>
  </div>

  {/* MARKETS */}
  <div
    style={{
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(10px)",
      padding: "15px",
      borderRadius: "12px",
    }}
  >
    <h2>Markets</h2>

    <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
      <div
        style={{
          padding: "12px",
          marginBottom: "10px",
          background: "#0a0a0a",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>Warriors @ Lakers</div>
        <div style={{ color: "#22c55e", fontWeight: "bold" }}>
          -110
        </div>
      </div>

      <div
        style={{
          padding: "12px",
          marginBottom: "10px",
          background: "#0a0a0a",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>Heat @ Celtics</div>
        <div style={{ color: "#22c55e", fontWeight: "bold" }}>
          -105
        </div>
      </div>
    </div>

    {!isPro && (
      <p style={{ color: "gold", marginTop: "10px" }}>
        🔒 Upgrade to PRO to unlock full market view
      </p>
    )}
  </div>
</div>
```

);
}
