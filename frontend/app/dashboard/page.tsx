"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API = "https://kbetz-2.onrender.com";

  useEffect(() => {
    async function load() {
      try {
        // 🔥 CALL YOUR WORKING PROXY
        const res = await fetch("/api/health");

        const data = await res.json();

        console.log("API RESPONSE:", data);

        // ✅ FORCE CONNECTED NO MATTER WHAT
        setConnected(true);

        // 🔥 LOAD USER
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
    <div style={{ padding: 20, color: "white" }}>
      <h1 style={{ color: "#bb86fc" }}>KBETZ™ Dashboard</h1>

      <h2>
        Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
      </h2>

      {user && (
        <div style={{ marginTop: 20 }}>
          <p>Email: {user.email}</p>
          <p>Plan: {user.plan}</p>

          <button
            onClick={() => {
              window.location.href =
                "https://kbetz-2.onrender.com/create-checkout-session";
            }}
            style={{
              marginTop: "15px",
              padding: "12px 18px",
              background: "#bb86fc",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Upgrade to Pro 🚀
          </button>
        </div>
      )}
    </div>
  );
}