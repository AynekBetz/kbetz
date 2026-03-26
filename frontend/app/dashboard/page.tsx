"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API = "https://kbetz-2.onrender.com";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/health");
        await res.json();

        setConnected(true);

        const userRes = await fetch(`${API}/me`);
        const userData = await userRes.json();

        setUser(userData.user);
      } catch (err) {
        console.error(err);
        setConnected(false);
      }
    }

    load();
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        color: "white",
        minHeight: "100vh",
        background: "#0b0b0f",
        fontFamily: "Arial",
        position: "relative",
        zIndex: 1
      }}
    >
      <h1 style={{ color: "#bb86fc" }}>
        KBETZ™ Dashboard
      </h1>

      <h2>
        Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
      </h2>

      {user && (
        <div style={{ marginTop: "20px" }}>
          <p>Email: {user.email}</p>
          <p>Plan: {user.plan}</p>

          {/* 🔥 CLICK-PROOF BUTTON */}
          <div
            onClick={() => {
              alert("CLICK WORKING");
              window.location.href =
                "https://kbetz-2.onrender.com/create-checkout-session";
            }}
            style={{
              marginTop: "30px",
              padding: "20px 25px",
              background: "#bb86fc",
              borderRadius: "10px",
              cursor: "pointer",
              display: "inline-block",
              fontSize: "18px",
              fontWeight: "bold",
              position: "relative",
              zIndex: 999999,         // 🔥 MAX PRIORITY
              pointerEvents: "auto"   // 🔥 FORCE CLICK
            }}
          >
            Upgrade to Pro 🚀
          </div>
        </div>
      )}
    </div>
  );
}