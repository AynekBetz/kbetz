"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API = "https://kbetz-2.onrender.com";

  useEffect(() => {
    async function load() {
      try {
        // 🔥 SIMPLE CONNECTION CHECK
        const res = await fetch(`${API}/health`);

        if (res.ok) {
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
                  method: "POST"
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