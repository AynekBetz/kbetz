"use client";

import { useEffect, useState } from "react";

export default function MissionControl() {
  const [time, setTime] = useState(null);
const [revenueToday, setRevenueToday] = useState(0);
const [systemStatus, setSystemStatus] = useState([
  { name: "Frontend", status: "Online", color: "#00ff99" },
  { name: "Backend", status: "Online", color: "#00ff99" },
  { name: "MongoDB", status: "Connected", color: "#00ff99" },
  { name: "Stripe", status: "Ready", color: "#00ff99" },
  { name: "Odds API", status: "Healthy", color: "#00ff99" },
  { name: "AI Engine", status: "Running", color: "#00ff99" },
]);
  useEffect(() => {
    setTime(new Date());

  const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
const revenueTimer = setInterval(() => {
  setRevenueToday((prev) => +(prev + 2.95).toFixed(2));
}, 5000);
   return () => {
  clearInterval(timer);
  clearInterval(revenueTimer);
};
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(0,255,255,.12), transparent 35%), radial-gradient(circle at top right, rgba(140,0,255,.25), transparent 40%), #050505",
        color: "#ffffff",
        fontFamily: "Inter, sans-serif",
        padding: "32px",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "8px",
          color: "#ffffff",
        }}
      >
        🚀 KBETZ Mission Control
      </h1>

      <p
        style={{
          color: "#b8b8b8",
          marginBottom: "30px",
        }}
      >
        CEO Dashboard • Launch Candidate
      </p>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "35px",
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.08)",
    backdropFilter: "blur(16px)",
  }}
>
  <div>
    <div
      style={{
        fontSize: "26px",
        fontWeight: "700",
        color: "#ffffff",
      }}
    >
      Welcome back, Kenya 👋
    </div>

    <div
      style={{
        color: "#9ca3af",
        marginTop: "6px",
      }}
    >
      Monitoring the entire KBETZ platform in real time.
    </div>
  </div>

  <div
    style={{
      display: "flex",
      gap: "14px",
      flexWrap: "wrap",
    }}
  >
    {[
      "Dashboard",
      "Revenue",
      "Users",
      "AI",
      "Servers",
      "Logs",
    ].map((item) => (
      <button
        key={item}
        style={{
          background: "rgba(0,255,255,.12)",
          border: "1px solid rgba(0,255,255,.25)",
          color: "#00ffff",
          padding: "10px 18px",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "600",
          transition: ".25s",
        }}
      >
        {item}
      </button>
    ))}
  </div>
</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: "20px",
        }}
      >
       {systemStatus.map((card) => ( 
          <div
            key={card.name}
            style={{
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(14px)",
            }}
          >
            <h3>{card.name}</h3>

            <p
              style={{
                color: card.color,
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              ● {card.status}
            </p>
          </div>
        ))}
      </div>
      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            marginBottom: "20px",
            color: "#ffffff",
          }}
        >
          💰 Executive Overview
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "20px",
          }}
        >
          {[
           ["Revenue Today", `$${revenueToday.toFixed(2)}`],
            ["Monthly Revenue", "$0.00"],
            ["MRR", "$0.00"],
            ["Lifetime Revenue", "$0.00"],
            ["PRO Members", "0"],
            ["Total Users", "0"],
          ].map(([title, value]) => (
            <div
              key={title}
              style={{
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: "18px",
                padding: "22px",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                {title}
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontSize: "30px",
                  fontWeight: "700",
                  color: "#00ffff",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>
<section
  style={{
    marginTop: "40px",
  }}
>
  <h2
    style={{
      fontSize: "28px",
      marginBottom: "20px",
      color: "#ffffff",
    }}
  >
    📈 Business Analytics
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: "20px",
    }}
  >
    {[
      ["Revenue Growth", "+0%"],
      ["New Users Today", "0"],
      ["Conversion Rate", "0%"],
      ["AI Accuracy", "0%"],
      ["App Health", "100%"],
    ].map(([title, value]) => (
      <div
        key={title}
        style={{
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: "18px",
          padding: "22px",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "28px",
            fontWeight: "700",
            color: "#8b5cf6",
          }}
        >
          {value}
        </div>
      </div>
    ))}
  </div>
</section>
<section
  style={{
    marginTop: "40px",
  }}
>
  <h2
    style={{
      fontSize: "28px",
      marginBottom: "20px",
      color: "#ffffff",
    }}
  >
    📜 Live Activity
  </h2>

  <div
    style={{
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: "18px",
      padding: "24px",
      backdropFilter: "blur(12px)",
    }}
  >
    {[
      "💳 New PRO subscription received",
      "👤 New user registered",
      "🧠 AI generated today's top picks",
      "🏆 Winning parlay recorded",
      "⚡ System health check completed",
    ].map((item, index) => (
      <div
        key={index}
        style={{
          padding: "14px 0",
          borderBottom:
            index !== 4 ? "1px solid rgba(255,255,255,.08)" : "none",
          color: "#d1d5db",
          fontSize: "16px",
        }}
      >
        {item}
      </div>
    ))}
  </div>
</section>
      <div
        style={{
          marginTop: "40px",
          background: "rgba(255,255,255,.05)",
          borderRadius: "18px",
          padding: "24px",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <h2>Current Time</h2>

        <p style={{ color: "#00ffff", fontSize: "22px" }}>
          {time ? time.toLocaleString() : "Loading..."}
        </p>
      </div>
    </main>
  );
}