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

          {/* 🔥 FINAL BUTTON */}
          <button
            onClick={async () => {
              try {
                console.log("CLICK FIRED");

                const res = await fetch("/api/checkout", {
                  method: "POST",
                });

                const data = await res.json();

                console.log("CHECKOUT RESPONSE:", data);

                if (data.url) {
                  window.location.href = data.url;
                } else {
                  alert("No URL returned");
                }
              } catch (err) {
                console.error("FRONTEND ERROR:", err);
                alert("Frontend error");
              }
            }}
            style={{
              marginTop: "20px",
              padding: "15px 20px",
              background: "#bb86fc",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px",
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