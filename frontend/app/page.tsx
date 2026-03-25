"use client";

import { useEffect, useState } from "react";
import { getHealth, getUser } from "../lib/api";

export default function Home() {
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
    <main style={{
      background: "#0b0b0f",
      color: "white",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <h1 style={{ color: "#bb86fc" }}>KBETZ™ Dashboard</h1>

      <h2>
        Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
      </h2>

      {user && (
        <>
          <p>Email: {user.email}</p>
          <p>Plan: {user.plan}</p>

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
        </>
      )}
    </main>
  );
}