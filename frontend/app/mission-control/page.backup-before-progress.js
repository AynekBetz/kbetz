"use client";

import { useEffect, useState } from "react";

export default function MissionControl() {
 const [time, setTime] = useState(null);
const [mounted, setMounted] = useState(false);

  useEffect(() => {
  setMounted(true);
  setTime(new Date());

  const timer = setInterval(() => {
    setTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);

  const statusCards = [
    { name: "Frontend", status: "Online", color: "#00ff99" },
    { name: "Backend", status: "Online", color: "#00ff99" },
    { name: "MongoDB", status: "Connected", color: "#00ff99" },
    { name: "Odds API", status: "Fallback", color: "#ffb347" },
    { name: "Stripe", status: "Ready", color: "#00ff99" },
    { name: "Cache", status: "Healthy", color: "#00ff99" },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(0,255,255,.15), transparent 35%), radial-gradient(circle at top right, rgba(140,0,255,.25), transparent 40%), #050505",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        padding: "30px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
         <h1
  style={{
    margin: 0,
    fontSize: "54px",
    fontWeight: 900,
    letterSpacing: "-1px",
    background:
      "linear-gradient(90deg,#ffffff 0%,#00ffe1 45%,#b76cff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 30px rgba(0,255,225,.25)",
  }}
>
            🚀 KBETZ Mission Control
          </h1>

       <p
  style={{
    color: "#9adfff",
    marginTop: 10,
    fontSize: "18px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  }}
>
  Launch Candidate v1.0
</p>

<div
  style={{
    marginTop: 18,
    width: 320,
    height: 2,
    borderRadius: 999,
    background:
      "linear-gradient(90deg,#00ffe1,#7c3aed,#ff3df2)",
    boxShadow: "0 0 22px rgba(0,255,225,.85)",
  }}
/> </div>

        <div
  style={{
    textAlign: "right",
    color: "#00ffe1",
  }}
>
  {mounted && time && (
    <>
      <div>{time.toLocaleDateString()}</div>
      <div style={{ fontSize: 28 }}>
        {time.toLocaleTimeString()}
      </div>
    </>
  )}
</div>

</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
  }}
>
                 {statusCards.map((card) => (
          <div
            key={card.name}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(14px)",
            }}
          >
            <div
              style={{
                color: "#bbbbbb",
                fontSize: "15px",
              }}
            >
              {card.name}
            </div>

            <div
              style={{
                marginTop: "12px",
                fontSize: "26px",
                fontWeight: 700,
                color: card.color,
              }}
            >
              ● {card.status}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}