"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {
const [games, setGames] = useState<any[]>([]);
const [alerts, setAlerts] = useState<any[]>([]);
const [user, setUser] = useState<any>(null);
const [topPicks, setTopPicks] = useState<any[]>([]);
const [parlay, setParlay] = useState<any>(null);

const isPro = user?.plan === "pro";

useEffect(() => {

// 🔥 STEP 2: UPGRADE DETECTION (ADDED)
const params = new URLSearchParams(window.location.search);

if (params.get("upgrade") === "success") {
const token = localStorage.getItem("token");

if (token) {
  fetch(`${API}/api/upgrade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  }).then(() => {
    window.location.href = "/dashboard";
  });
}

}

fetchUser();
fetchGames();

const interval = setInterval(fetchGames, 5000);
return () => clearInterval(interval);

}, []);

// USER
const fetchUser = async () => {
const token = localStorage.getItem("token");

if (!token) {
console.log("No token → redirect");
window.location.href = "/login";
return;
}

try {
const res = await fetch(`${API}/api/me`, {
headers: { Authorization: `Bearer ${token}` },
});

const data = await res.json();
console.log("ME RESPONSE:", data);

if (!data || data.error) {
console.log("Invalid token → redirect");
localStorage.removeItem("token");
window.location.href = "/login";
return;
}

setUser(data);
} catch (err) {
console.log("Auth error:", err);
window.location.href = "/login";
}

};

// AI
const impliedProb = (odds: number) => {
if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
return 100 / (odds + 100);
};

const generateAI = (games: any[]) => {
const evaluated = games.map((g) => {
const prob = impliedProb(g.odds);
const trueProb = prob + 0.03;
const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);
return { ...g, ev };
});

const sorted = evaluated.sort((a, b) => b.ev - a.ev);
setTopPicks(sorted.slice(0, 3));

if (sorted.length >= 2) {
const p1 = sorted[0];
const p2 = sorted[1];

const d1 = p1.odds < 0 ? 1 + 100 / Math.abs(p1.odds) : 1 + p1.odds / 100;
const d2 = p2.odds < 0 ? 1 + 100 / Math.abs(p2.odds) : 1 + p2.odds / 100;

const combined = ((d1 * d2) - 1) * 100;

setParlay({
legs: [p1, p2],
odds: combined.toFixed(2),
});
}

};

// ALERTS
const createAlert = (text: string) => {
const id = Date.now();
setAlerts((prev) => [{ id, text }, ...prev].slice(0, 5));

setTimeout(() => {
setAlerts((prev) => prev.filter((a) => a.id !== id));
}, 4000);

};

const playSound = () => {
try {
const audio = new Audio("/alert.mp3");
audio.play();
} catch {}
};

// FETCH
const fetchGames = async () => {
const res = await fetch(`${API}/api/data`);
const data = await res.json();

const g = data.games || [];
setGames(g);

generateAI(g);

if (Math.random() > 0.7) {
createAlert("🚨 Market movement detected");
playSound();
}

};

// UPGRADE
const upgrade = async () => {
const token = localStorage.getItem("token");

if (!token) {
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

const data = await res.json();

if (data.url) window.location.href = data.url;

};

return (

<div style={{
background: "linear-gradient(135deg, #050505, #0a0a0a)",
minHeight: "100vh",
color: "white",
padding: "20px",
fontFamily: "Inter, sans-serif"
}}>

{/* HEADER */}

  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px"
  }}>
    <h1 style={{
      fontSize: "28px",
      background: "linear-gradient(90deg, #a855f7, #22c55e)",
      WebkitBackgroundClip: "text",
      color: "transparent"
    }}>
      KBETZ TERMINAL
    </h1>

{!isPro && (
  <button onClick={upgrade} style={{
    background: "linear-gradient(90deg, gold, orange)",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer"
  }}>
    Upgrade PRO
  </button>
)}

  </div>

{/* ALERTS */}

  <div style={{ marginBottom: "20px" }}>
    {alerts.map((a) => (
      <div key={a.id} style={{
        background: "#111",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "8px",
        border: "1px solid #222"
      }}>
        {a.text}
      </div>
    ))}
  </div>

{/* AI PICKS */}

  <div style={{
    background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: "0 0 20px rgba(168,85,247,0.3)"
  }}>
    <h2>🧠 AI PICKS</h2>

<div style={{ filter: isPro ? "none" : "blur(6px)" }}>
  {topPicks.map((p, i) => (
    <div key={i} style={{ marginBottom: "10px" }}>
      {p.away} @ {p.home}
      <div style={{ color: "#22c55e" }}>
        EV: {p.ev.toFixed(2)}
      </div>
    </div>
  ))}
</div>

  </div>

{/* PARLAY */}
{parlay && (
<div style={{
background: "#0a0a0a",
padding: "15px",
borderRadius: "12px",
marginBottom: "20px"
}}> <h2>🎯 AI PARLAY</h2>

  <div style={{ filter: isPro ? "none" : "blur(6px)" }}>
    {parlay.legs.map((l: any, i: number) => (
      <div key={i}>{l.away} @ {l.home}</div>
    ))}
    <div style={{ color: "#22c55e" }}>
      Odds: +{parlay.odds}
    </div>
  </div>
</div>

)}

{/* GAMES */}

  <div style={{
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    padding: "15px",
    borderRadius: "12px"
  }}>
    <h2>Markets</h2>

<div style={{ filter: isPro ? "none" : "blur(6px)" }}>
  {games.map((g) => (
    <div key={g.id} style={{
      padding: "12px",
      marginBottom: "10px",
      background: "#0a0a0a",
      borderRadius: "10px",
      display: "flex",
      justifyContent: "space-between"
    }}>
      <div>{g.away} @ {g.home}</div>

      <div style={{ color: "#22c55e", fontWeight: "bold" }}>
        {g.odds}
      </div>
    </div>
  ))}
</div>

  </div>

</div>

);
}
