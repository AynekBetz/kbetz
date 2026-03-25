"use client";

import { useEffect, useState } from "react";
import { getHealth, getUser } from "../../lib/api";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const health = await getHealth();
        const me = await getUser();

        console.log("HEALTH:", health);
        console.log("USER:", me);

        setConnected(health.connected);
        setUser(me.user);
      } catch (err) {
        console.error("API ERROR:", err);
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
      {/* TITLE */}
      <h1 style={{ color: "#bb86fc", fontSize: "28px" }}>
        KBETZ™ Dashboard
      </h1>

      {/* BACKEND STATUS */}
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#1a1a22",
          borderRadius: "10px"
        }}
      >
        <h2>Backend Status</h2>
        <p style={{ fontSize: "18px" }}>
          {connected ? "🟢 Connected" : "🔴 Not Connected"}
        </p>
      </div>

      {/* USER INFO */}
      {user && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#1a1a22",
            borderRadius: "10px"
          }}
        >
          <h2>User</h2>

          <p>Email: {user.email}</p>

          <p>
            Plan:{" "}
            <strong
              style={{
                color: user.plan === "pro" ? "#00ffcc" : "#ff4d6d"
              }}
            >
              {user.plan.toUpperCase()}
            </strong>
          </p>

          {/* STRIPE BUTTON */}
          {user.plan !== "pro" && (
            <button
              onClick={async () => {
                console.log("🔥 BUTTON CLICKED");

                try {
                  setLoading(true);

                  const API = process.env.NEXT_PUBLIC_API_URL;
                  console.log("API URL:", API);

                  const res = await fetch(
                    `${API}/create-checkout-session`,
                    {
                      method: "POST"
                    }
                  );

                  console.log("RESPONSE STATUS:", res.status);

                  const data = await res.json();
                  console.log("RESPONSE DATA:", data);

                  if (data.url) {
                    console.log("➡️ Redirecting to Stripe...");
                    window.location.href = data.url;
                  } else {
                    alert("Stripe session failed");
                  }

                } catch (err) {
                  console.error("❌ FETCH ERROR:", err);
                  alert("Error connecting to Stripe");
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                marginTop: "15px",
                padding: "12px 18px",
                background: "#bb86fc",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px"
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