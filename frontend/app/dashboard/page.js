"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [user, setUser] = useState(null);
const [topPicks, setTopPicks] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [aiParlay, setAiParlay] = useState([]);
const [lastSoundTime, setLastSoundTime] = useState(0);
const [alerts, setAlerts] = useState([]);

const isPro = user?.isPro === true || user?.plan === "pro";

/* =========================
AUTH
========================= */
useEffect(() => {
fetchUser();
fetchGames();
const interval = setInterval(fetchGames, 5000);
return () => clearInterval(interval);
}, []);

const fetchUser = async () => {
const token = localStorage.getItem("token");
if (!token) return (window.location.href = "/login");

const res = await fetch(`${API}/api/me`, {
headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
setUser(data);

if (data.email) localStorage.setItem("email", data.email);
};

/* =========================
REAL EV MODEL (NO RANDOM)
========================= */

// implied probability
const impliedProb = (odds) => {
if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
return 100 / (odds + 100);
};

// remove vig approximation
const fairProb = (odds) => {
const p = impliedProb(odds);
return p * 0.97; // small bookmaker margin removal
};

// EV calculation
const calcEV = (odds) => {

const p = fairProb(odds);

// decimal odds
const decimal = odds > 0
? (odds / 100) + 1
: (100 / Math.abs(odds)) + 1;

return ((p * decimal) - 1) * 100;
};

/* =========================
SHARP SIGNAL (IMPROVED)
========================= */
const getSignal = (move, ev) => {

if (move < -5 && ev > 1) return "STRONG BUY";
if (move < -3 && ev > 0) return "BUY";
if (move > 5 && ev < 0) return "FADE";

return "NEUTRAL";
};

/* =========================
ALERT SYSTEM
========================= */
const triggerAlert = (msg) => {
const now = Date.now();

if (now - lastSoundTime > 2000) {
try { new Audio("/alert.mp3").play(); } catch {}
setLastSoundTime(now);
}

setAlerts(prev => [
{ id: now, msg },
...prev.slice(0, 4)
]);
};

/* =========================
DATA
========================= */
const fetchGames = async () => {
const res = await fetch(`${API}/api/data`);
const data = await res.json();
const g = data.games || [];

const enriched = g.map(game => {

const ev = calcEV(game.odds);

const prev = lastOdds[game.id];
let move = 0;

if (prev) move = game.odds - prev;

const signal = getSignal(move, ev);

// 🔥 only strong alerts
if (signal === "STRONG BUY") {
triggerAlert(`🔥 Sharp value detected on ${game.away}`);
}

return {
...game,
ev,
signal
};
});

detectMovement(g);

setGames(enriched);
generateAI(enriched);

setLastOdds(prev => {
const updated = {...prev};
g.forEach(game => updated[game.id] = game.odds);
return updated;
});
};

/* =========================
ODDS MOVEMENT
========================= */
const detectMovement = (games) => {
const now = Date.now();

games.forEach(g => {
const prev = lastOdds[g.id];

if (prev && prev !== g.odds) {
if (now - lastSoundTime > 2000) {
try { new Audio("/alert.mp3").play(); } catch {}
setLastSoundTime(now);
}
}
});
};

/* =========================
AI (unchanged UI logic)
========================= */
const generateAI = (games) => {
const picks = games.slice(0, 3).map(g => ({
...g,
confidence: Math.floor(Math.random() * 25 + 65)
}));

setTopPicks(picks);
setAiParlay(picks);
};

/* =========================
BET SLIP (unchanged)
========================= */
const addToSlip = (game) => {
if (betSlip.find(b => b.id === game.id)) return;
setBetSlip([...betSlip, game]);
};

const removeBet = (id) => {
setBetSlip(betSlip.filter(b => b.id !== id));
};

const americanToDecimal = (odds) => {
if (odds > 0) return (odds / 100) + 1;
return (100 / Math.abs(odds)) + 1;
};

const parlayOdds = () => {
if (!betSlip.length) return 0;
return betSlip.reduce((acc, bet) => acc * americanToDecimal(bet.odds), 1);
};

const payout = (stakeAmount = 100) => {
return (stakeAmount * parlayOdds()).toFixed(2);
};

const addAiParlay = () => {
setBetSlip(aiParlay);
};

/* =========================
UPGRADE
========================= */
const handleUpgradeClick = async () => {
const email = localStorage.getItem("email");

const res = await fetch(`${API}/api/checkout`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email })
});

const data = await res.json();
if (data.url) window.location.href = data.url;
};

/* =========================
UI (UNCHANGED)
========================= */
if (!user) return <div style={{color:"white"}}>Loading...</div>;

return (

<div style={styles.page}>

<div style={styles.alertBox}>
{alerts.map(a => (
<div key={a.id} style={styles.alert}>
{a.msg}
</div>
))}
</div>

<div style={{flex:1}}>

<div style={styles.header}>
<h1 style={styles.logo}>KBETZ ELITE</h1>

<div style={styles.right}>
<span>{isPro ? "PRO" : "FREE"}</span>

{!isPro && (
<button onClick={handleUpgradeClick} style={styles.btnPro}>
Upgrade
</button>
)}
</div>
</div>

<div style={styles.card}>
<h2>🧠 AI PARLAY</h2>

{aiParlay.map((p,i)=>(
<div key={i} style={{display:"flex", justifyContent:"space-between"}}>
<span>{p.away} @ {p.home}</span>
<span>{p.confidence}%</span>
</div>
))}

<button onClick={addAiParlay} style={styles.aiBtn}>
Add AI Parlay
</button>
</div>

<div style={styles.card}>
<h2>📈 LIVE MARKETS</h2>

{games.map(g=>{

const prev = lastOdds[g.id];
const up = prev && g.odds > prev;
const down = prev && g.odds < prev;

return (
<div key={g.id} style={styles.marketRow}>

<span>{g.away} @ {g.home}</span>

<button
onClick={()=>addToSlip(g)}
style={{
...styles.oddsBtn,
color: up ? "#00ff99" : down ? "#ff4d4d" : "white",
transform: up || down ? "scale(1.1)" : "scale(1)",
boxShadow: up ? "0 0 10px #00ff99" : down ? "0 0 10px #ff4d4d" : "none",
transition: "0.2s"
}}
>
{g.odds}
</button>

<span style={{
fontWeight:"bold",
color: g.ev > 0 ? "#00ff99" : "#ff4d4d"
}}>
{g.ev > 0 ? "+" : ""}{g.ev.toFixed(2)}%
</span>

<span style={{
fontWeight:"bold",
color:
g.signal === "STRONG BUY"
? "#00ff99"
: g.signal === "BUY"
? "#22c55e"
: g.signal === "FADE"
? "#ff4d4d"
: "#888"
}}>
{g.signal}
</span>

</div>
);
})}

</div>

</div>

<div style={styles.slip}>
<h3>🧾 Bet Slip</h3>

{betSlip.map((b)=>(
<div key={b.id} style={styles.slipItem}>
<span>{b.away}</span>
<button onClick={()=>removeBet(b.id)}>✖</button>
</div>
))}

{betSlip.length > 0 && (
<>
<input
type="number"
value={stake}
onChange={(e)=>setStake(Number(e.target.value))}
style={styles.input}
/>

<div>Odds: {parlayOdds().toFixed(2)}x</div>
<div>Payout: ${payout(stake)}</div>

<button style={styles.placeBtn}>
Place Bet
</button>
</>
)}

</div>

</div>
);
}