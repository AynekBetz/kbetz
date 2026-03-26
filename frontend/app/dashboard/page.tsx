"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API = "https://kbetz-2.onrender.com";

  useEffect(() => {
    async function load() {
      try {
        // 🔥 SIMPLE CONNECTION CHECK
        const res = await fetch(`${API}/health`);

        if (res.ok) {
          // ✅ FORCE CONNECTED IF BACKEND RESPONDS
          setConnected(true);
        }

        const userRes = await fetch(`${API}/me`);
        const userData = await userRes.json();

        setUser(userData.user);

      } catch (err) {
        console.error("Connection failed:", err);
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

      {/* BACKEND STATUS */}
      <div style={{ marginTop: "20px" }}>
        <h2>
          Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
        </h2>
      </div>

      {/* USER INFO */}
      {user && (
        <div style={{ marginTop: "20px" }}>
          <p>Email: {user.email}</p>

          <p>
            Plan:{" "}
            <strong
              style={{
                color: user.plan === "pro" ? "#00ffcc" : "#ff4d6d"
              }}
            >
              {user.plan}
            </strong>
          </p>

          {/* 💰 STRIPE BUTTON */}
          {user.plan !== "pro" && (
            <button
              onClick={async () => {
                try {
                  setLoading(true);

                  const res = await fetch(
                    `${API}/create-checkout-session`,
                    {
                      method: "POST"
                    }
                  );

                  const data = await res.json();

                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    alert("Stripe session failed");
                  }

                } catch (err) {
                  console.error(err);
                  alert("Error connecting to Stripe");
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                marginTop: "10px",
                padding: "10px 15px",
                background: "#bb86fc",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              {loading ? "Loading..." : "Upgrade to Pro 🚀"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}