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
        fontFamily: "Arial"
      }}
    >
      <h1 style={{ color: "#bb86fc" }}>KBETZ™ Dashboard</h1>

      <h2>
        Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
      </h2>

      {user && (
        <div style={{ marginTop: "20px" }}>
          <p>Email: {user.email}</p>
          <p>Plan: {user.plan}</p>

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
              fontSize: "18px"
            }}
          >
            Upgrade to Pro 🚀
          </button>
        </div>
      )}
    </div>
  );
}