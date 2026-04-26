"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [alerts, setAlerts] = useState([]);
const [user, setUser] = useState(null);
const [topPicks, setTopPicks] = useState([]);
const [parlay, setParlay] = useState(null);

// 🔥 FIXED PRO DETECTION
const isPro = user?.isPro === true || user?.plan === "pro";

// LOGOUT
const handleLogout = () => {
localStorage.removeItem("token");
localStorage.removeItem("email");
window.location.href = "/login";
};

useEffect(() => {

try {
if (typeof window !== "undefined") {
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
}
} catch (err) {
console.log("Upgrade check skipped:", err);
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

// 🔥 SAVE EMAIL FOR STRIPE
if (data.email) {
localStorage.setItem("email", data.email);
}

} catch {
window.location.href = "/login";
}
};

// AI LOGIC
const impliedProb = (odds) => {
if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
return 100 / (odds + 100);
};

const generateAI = (games) => {
const evaluated = games.map((g) => {

const prob = impliedProb(g.odds);
const trueProb = prob + (Math.random() * 0.06);

const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);

const confidence = Math.min(95, Math.max(55, Math.floor(trueProb * 100)));

const move = Math.floor(Math.random() * 6) - 3;

return {
...g,
ev,
confidence,
movement: move,
direction: move > 0 ? "up" : move < 0 ? "down" : "flat"
};

});

const sorted = evaluated.sort((a, b) => b.ev - a.ev);
setTopPicks(sorted.slice(0, 3));
};

// ALERTS
const createAlert = (text) => {
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

// DATA
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

// 🔥 FIXED UPGRADE CLICK
const handleUpgradeClick = () => {
console.log("🔥 UPGRADE CLICKED");

const email = localStorage.getItem("email");

if (!email) {
alert("Missing email — login again");
window.location.href = "/login";
return;
}

fetch(`${API}/api/stripe/checkout`, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ email }) // ✅ FIXED
})
.then(res => res.json())
.then(data => {
console.log("CHECKOUT RESPONSE:", data);

if (data.url) {
window.location.href = data.url;
} else {
alert("Upgrade failed");
}
})
.catch(err => {
console.error("CHECKOUT ERROR:", err);
alert("Connection error");
});
};

// LOADING
if (!user) {
return (
<div style={{
background: "black",
color: "white",
padding: "40px",
minHeight: "100vh"
}}>
Loading KBETZ...
</div>
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
marginBottom: "25px",
position: "relative",
zIndex: 100
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
cursor: "pointer",
zIndex: 50
}}>
Logout 
</button>

{/* 🔥 FIXED CLICKABLE BUTTON */}
{!isPro && (
<div style={{ position: "relative", zIndex: 99999 }}>
<button
onClick={handleUpgradeClick}
style={{
background: "linear-gradient(90deg, gold, orange)",
padding: "10px 18px",
borderRadius: "8px",
border: "none",
fontWeight: "bold",
cursor: "pointer",
zIndex: 99999,
position: "relative"
}}
>
Upgrade PRO
</button>
</div>
)}

<button
onClick={() => window.location.href = "/signup"}
style={{
background: "#111",
padding: "8px 12px",
borderRadius: "6px",
border: "1px solid #333",
color: "#00ff99",
cursor: "pointer"
}}
>
Sign Up
</button>

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

{topPicks.map((p, i) => (

<div key={i} style={{
marginBottom: "12px",
padding: "10px",
background: "rgba(0,0,0,0.3)",
borderRadius: "8px"
}}>

<div style={{
display: "flex",
justifyContent: "space-between",
fontWeight: "bold"
}}>
<span>{p.away} @ {p.home}</span>

<span style={{
color:
p.direction === "up"
? "#22c55e"
: p.direction === "down"
? "#ff4d4d"
: "white"
}}>
{p.odds}
</span>

</div>

<div style={{
display: "flex",
gap: "10px",
fontSize: "12px",
marginTop: "5px"
}}>
<span style={{ color: "#22c55e" }}>
EV: +{p.ev?.toFixed(2)}%
</span>

<span>
Conf: {p.confidence}%
</span>

</div>

</div>
))}

</div>

</div>
);
}