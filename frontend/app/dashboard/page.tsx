"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API = "https://kbetz-2.onrender.com";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();

        setConnected(data.connected);

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
        padding: "40px",
        background: "#0b0b0f",
        color: "white",
        minHeight: "100vh",
        fontFamily: "Arial",
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
            onClick={async () => {
              const res = await fetch("/api/checkout", {
                method: "POST",
              });

              const data = await res.json();

              if (data.url) {
                window.location.href = data.url;
              } else {
                alert("Checkout failed");
              }
            }}
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              background: "#bb86fc",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Upgrade to Pro 🚀
          </button>
        </div>
      )}
    </div>
  );
}