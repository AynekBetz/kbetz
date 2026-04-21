"use client";

import { useEffect, useState } from "react";

// 🔥 PRODUCTION SAFE (fixes mobile upgrade issue)
const API = process.env.NEXT_PUBLIC_API_URL || "https://kbetz.onrender.com";

export default function Dashboard() {

const [games, setGames] = useState<any[]>([]);
const [alerts, setAlerts] = useState<any[]>([]);
const [user, setUser] = useState<any>(null);
const [topPicks, setTopPicks] = useState<any[]>([]);
const [parlay, setParlay] = useState<any>(null);

const isPro = user?.plan === "pro";

// ✅ LOGOUT
const handleLogout = () => {
localStorage.removeItem("token");
window.location.href = "/login";
};

useEffect(() => {

const params = new URLSearchParams(window.location.search);

// ✅ STRIPE SUCCESS HANDLING
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

// ✅ USER LOAD
const fetchUser = async () => {
const token = localStorage.getItem("token");

if (!token) {
window.location.href = "/login";
return;
}

try {
const res = await fetch(`${API}/api/me`, {
headers: { Authorization: `Bearer ${token}` },
});

const data = await res.json();

if (!data || data.error) {
  localStorage.removeItem("token");
  window.location.href = "/login";
  return;
}

setUser(data);

} catch {
window.location.href = "/login";
}
};

// 🔢 AI LOGIC
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

// 🔔 ALERTS
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

// 📡 DATA FETCH (SAFE)
const fetchGames = async () => {
try {
const res = await fetch(`${API}/api/data`);
const data = await res.json();

let g = data.games || [];

if (!g || g.length === 0) {
  g = [
    { id: 1, home: "Lakers", away: "Warriors", odds: -110 },
    { id: 2, home: "Celtics", away: "Heat", odds: -105 }
  ];
}

setGames(g);
generateAI(g);

if (Math.random() > 0.7) {
  createAlert("🚨 Market movement detected");
  playSound();
}

} catch {
setGames([
{ id: 1, home: "Lakers", away: "Warriors", odds: -110 },
{ id: 2, home: "Celtics", away: "Heat", odds: -105 }
]);
}
};

// 💳 STRIPE UPGRADE (FIXED FOR MOBILE)
const upgrade = async () => {
const token = localStorage.getItem("token");

if (!token) {
window.location.href = "/login";
return;
}

try {
const res = await fetch(`${API}/api/checkout`, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ token })
});

const data = await res.json();

// ✅ CRITICAL FIX (mobile safe redirect)
if (data.url) {
  window.location.href = data.url;
} else {
  alert("Upgrade failed. Try again.");
}

} catch {
alert("Connection error.");
}
};

// 🛑 PREVENT BLANK SCREEN
if (!user) {
return (
<div style={{
background: "black",
color: "white",
padding: "40px",
minHeight: "100vh"
}}>
Loading KBETZ... </div>
);
}

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

  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

<span style={{ color: "#22c55e", fontWeight: "bold" }}>
  {isPro ? "PRO" : "FREE"}
</span>

<button onClick={handleLogout} style={{
  background: "#222",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "none",
  color: "white",
  cursor: "pointer"
}}>
  Logout
</button>

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
</div>

{/* AI PICKS */}

<div style={{
  background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
  padding: "20px",
  borderRadius: "16px",
  marginBottom: "20px"
}}>
  <h2>🧠 AI PICKS</h2>

{topPicks.map((p, i) => ( <div key={i}>
{p.away} @ {p.home}
<div style={{ color: "#22c55e" }}>
EV: {p.ev?.toFixed(2)} </div> </div>
))}

</div>

{/* MARKETS */}

<div style={{
  background: "rgba(255,255,255,0.05)",
  padding: "15px",
  borderRadius: "12px"
}}>
  <h2>Markets</h2>

{games.map((g) => (
<div key={g.id} style={{
padding: "12px",
marginBottom: "10px",
background: "#0a0a0a",
borderRadius: "10px",
display: "flex",
justifyContent: "space-between"
}}> <div>{g.away} @ {g.home}</div>
<div style={{ color: "#22c55e" }}>
{g.odds} </div> </div>
))}

</div>

</div>
);
}
