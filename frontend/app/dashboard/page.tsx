"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API = "https://kbetz-2.onrender.com";

  useEffect(() => {
    async function load() {
      try {
        // ✅ Call proxy (this is working)
        const res = await fetch("/api/health");
        const data = await res.json();

        console.log("API RESPONSE:", data);

        // ✅ FORCE CONNECTED
        setConnected(true);

        // ✅ Load user
        const userRes = await fetch(`${API}/me`);
        const userData = await userRes.json();

        setUser(userData.user);

      } catch (err) {
        console.error("❌ ERROR:", err);
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
        fontFamily: "Arial"
      }}
    >
      <h1 style={{ color: "#bb86fc" }}>
        KBETZ™ Dashboard
      </h1>

      {/* STATUS */}
      <div style={{ marginTop: "20px" }}>
        <h2>
          Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
        </h2>
      </div>

      {/* USER */}
      {user && (
        <div style={{ marginTop: "20px" }}>
          <p>Email: {user.email}</p>
          <p>Plan: {user.plan}</p>

          {/* 🔥 BUTTON DEBUG */}
          <button
            onClick={() => {
              alert("CLICK WORKING");

              window.location.href =
                "https://kbetz-2.onrender.com/create-checkout-session";
            }}
            style={{
              marginTop: "20px",
              padding: "15px 20px",
              background: "#bb86fc",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px",
              position: "relative",
              zIndex: 9999
            }}
          >
            Upgrade to Pro 🚀
          </button>
        </div>
      )}
    </div>
  );
}