"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API = "https://kbetz-2.onrender.com";

  // 🔥 LOAD DATA
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

  // 🔥 FORCE CLICK HANDLER (BYPASS REACT)
  useEffect(() => {
    const btn = document.getElementById("test-btn");

    if (btn) {
      btn.addEventListener("click", () => {
        alert("REAL CLICK WORKED");

        window.location.href =
          "https://kbetz-2.onrender.com/create-checkout-session";
      });
    }
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

      <h2>
        Backend: {connected ? "🟢 Connected" : "🔴 Not Connected"}
      </h2>

      {user && (
        <div style={{ marginTop: "20px" }}>
          <p>Email: {user.email}</p>
          <p>Plan: {user.plan}</p>

          {/* 🔥 TEST BUTTON */}
          <div
            id="test-btn"
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "red",
              borderRadius: "10px",
              cursor: "pointer",
              display: "inline-block",
              fontWeight: "bold"
            }}
          >
            CLICK TEST 🚨
          </div>
        </div>
      )}
    </div>
  );
}