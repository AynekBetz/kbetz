"use client";

import { useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/create-checkout-session`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Stripe error");
      }
    } catch (err) {
      console.log(err);
      alert("Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">KBETZ Terminal</h1>

      {/* 🔥 UPGRADE BUTTON */}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold mb-6"
      >
        {loading ? "Loading..." : "🔥 Upgrade to Pro"}
      </button>

      {/* EXISTING CONTENT */}
      <div className="space-y-4 text-xl">
        <p>🔥 Daily AI Bet</p>
        <p>EV Heatmap</p>
        <p>Arbitrage Opportunities</p>
        <p>Steam Moves</p>
        <p>Sportsbook Comparison</p>
      </div>
    </div>
  );
}