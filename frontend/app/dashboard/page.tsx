"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [prevOdds, setPrevOdds] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [topPicks, setTopPicks] = useState<any[]>([]);
  const [parlay, setParlay] = useState<any>(null);

  const isPro = user?.plan === "pro";

  useEffect(() => {
    fetchUser();
    fetchGames();

    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= USER =================
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("FETCH USER TOKEN:", token);

      if (!token) return;

      const res = await fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("USER DATA:", data);

      setUser(data);
    } catch (err) {
      console.log("USER ERROR:", err);
    }
  };

  // ================= FETCH GAMES =================
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API}/api/data`);
      const data = await res.json();

      const newGames = data.games || [];
      const updatedPrev = { ...prevOdds };

      newGames.forEach((g: any) => {
        updatedPrev[g.id] = g.odds;
      });

      setPrevOdds(updatedPrev);
      setGames(newGames);

    } catch (err) {
      console.log("ODDS FETCH ERROR:", err);
    }
  };

  // ================= 🔥 STRIPE UPGRADE (FULL DEBUG) =================
  const upgrade = async () => {
    console.log("🔥 CLICKED UPGRADE");

    try {
      const token = localStorage.getItem("token");
      console.log("TOKEN:", token);

      if (!token) {
        alert("Please login first");
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      console.log("RAW RESPONSE:", res);

      const data = await res.json();

      console.log("🔥 CHECKOUT DATA FULL:", data);

      // 🚨 SHOW REAL ERROR
      if (!data.url) {
        alert("STRIPE ERROR:\n" + JSON.stringify(data, null, 2));
        return;
      }

      // ✅ SUCCESS
      window.location.href = data.url;

    } catch (err) {
      console.log("UPGRADE ERROR:", err);
      alert("Upgrade failed");
    }
  };

  return (
    <div
      style={{
        background: "#050505",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            background: "linear-gradient(90deg, #a855f7, #22c55e)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          KBETZ TERMINAL
        </h1>

        {!isPro && (
          <button
            onClick={upgrade}
            style={{
              background: "linear-gradient(90deg, gold, orange)",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Upgrade PRO
          </button>
        )}
      </div>

      {/* AI PICKS CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "20px",
        }}
      >
        <h2>🧠 AI PICKS</h2>
        <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
          {topPicks.length === 0 && <div>Loading AI picks...</div>}
        </div>
      </div>

      {/* MARKETS */}
      <div
        style={{
          background: "#0a0a0a",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <h2>Markets</h2>

        {games.length === 0 && <div>Loading games...</div>}

        {games.map((g) => (
          <div key={g.id} style={{ marginBottom: "8px" }}>
            {g.away} @ {g.home}
          </div>
        ))}
      </div>
    </div>
  );
}