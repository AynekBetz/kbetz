"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/me`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>KBETZ Terminal</h1>

      {/* PLAN */}
      {isPro ? (
        <p style={{ color: "lime" }}>💎 PRO</p>
      ) : (
        <p style={{ color: "gray" }}>Free</p>
      )}

      {/* UPGRADE */}
      {!isPro && (
        <button
          onClick={async () => {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/create-checkout-session`,
              {
                method: "POST",
                headers: {
                  Authorization:
                    "Bearer " + localStorage.getItem("token"),
                },
              }
            );

            const data = await res.json();
            window.location.href = data.url;
          }}
        >
          Upgrade to Pro
        </button>
      )}

      {/* FEATURES */}
      <div style={{ marginTop: 20 }}>
        <p>🔥 Daily AI Bet</p>

        <div style={!isPro ? { opacity: 0.3 } : {}}>
          <p>EV Heatmap</p>
          <p>Arbitrage Opportunities</p>
          <p>Steam Moves</p>
          <p>Sportsbook Comparison</p>
        </div>
      </div>
    </div>
  );
}