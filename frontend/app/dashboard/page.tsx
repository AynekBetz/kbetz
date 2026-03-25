"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isPro = user?.plan === "pro";

  /* =========================
     LOAD USER (NO HOOK = SAFE)
  ========================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

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
        console.log("User load error:", err);
      }
    };

    fetchUser();
  }, []);

  /* =========================
     STRIPE UPGRADE
  ========================= */
  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Upgrade failed");
      }
    } catch (err) {
      console.log(err);
      alert("Upgrade error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">KBETZ Terminal</h1>

        {/* 💎 PLAN BADGE */}
        {isPro ? (
          <span className="bg-green-500 px-3 py-1 rounded-full text-sm">
            💎 PRO
          </span>
        ) : (
          <span className="bg-gray-600 px-3 py-1 rounded-full text-sm">
            Free
          </span>
        )}
      </div>

      {/* 🔥 UPGRADE BUTTON */}
      {!isPro && (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold mb-6"
        >
          {loading ? "Loading..." : "🔥 Upgrade to Pro"}
        </button>
      )}

      {/* FEATURES */}
      <div className="space-y-4 text-xl">

        {/* FREE FEATURE */}
        <p>🔥 Daily AI Bet</p>

        {/* PRO FEATURES */}
        <div className={!isPro ? "opacity-30 blur-sm" : ""}>
          <p>EV Heatmap</p>
          <p>Arbitrage Opportunities</p>
          <p>Steam Moves</p>
          <p>Sportsbook Comparison</p>
        </div>

        {!isPro && (
          <p className="text-yellow-400 text-sm">
            🔒 Upgrade to unlock advanced analytics
          </p>
        )}
      </div>
    </div>
  );
}