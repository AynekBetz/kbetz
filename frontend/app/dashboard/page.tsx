"use client";

import { useEffect, useState } from "react";
import { getHealth, getUser } from "../../lib/api";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const health = await getHealth();
        const me = await getUser();

        setConnected(health.connected);
        setUser(me.user);
      } catch (err) {
        console.error("API ERROR:", err);
      }
    }

    load();
  }, []);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      
      <h1 style={{ color: "#bb86fc" }}>
        KBETZ Dashboard
      </h1>

      {/* BACKEND STATUS */}
      <div style={{ marginTop: 20 }}>
        <h2>
          Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
        </h2>
      </div>

      {/* USER INFO */}
      {user && (
        <div style={{ marginTop: 20 }}>
          <p>Email: {user.email}</p>

          <p>
            Plan:{" "}
            <strong style={{
              color: user.plan === "pro" ? "#00ffcc" : "#ff4d6d"
            }}>
              {user.plan.toUpperCase()}
            </strong>
          </p>

          {user.plan !== "pro" && (
            <button style={{
              marginTop: "10px",
              padding: "10px 15px",
              background: "#bb86fc",
              border: "none",
              borderRadius: "6px"
            }}>
              Upgrade to Pro 🚀
            </button>
          )}
        </div>
      )}

    </div>
  );
}