"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API = "https://kbetz-2.onrender.com";

  useEffect(() => {
    async function load() {
      try {
        console.log("Calling backend...");

        // 🔥 FORCE SIMPLE REQUEST (NO BLOCKING)
        const res = await fetch(`${API}/health`, {
          method: "GET",
          mode: "cors"
        });

        console.log("STATUS:", res.status);

        const health = await res.json();

        const userRes = await fetch(`${API}/me`, {
          method: "GET",
          mode: "cors"
        });

        const userData = await userRes.json();

        setConnected(health.connected);
        setUser(userData.user);

      } catch (err) {
        console.error("❌ FETCH FAILED:", err);
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
            onClick={async () => {
              try {
                const res = await fetch(`${API}/create-checkout-session`, {
                  method: "POST",
                  mode: "cors"
                });

                const data = await res.json();

                if (data.url) {
                  window.location.href = data.url;
                } else {
                  alert("Stripe failed");
                }

              } catch (err) {
                console.error(err);
                alert("Stripe error");
              }
            }}
          >
            Upgrade to Pro 🚀
          </button>
        </div>
      )}
    </div>
  );
}