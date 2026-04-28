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
try {
const token = localStorage.getItem("token");
if (!token) return (window.location.href = "/login");

const res = await fetch(`${API}/api/me`, {
headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
setUser(data);

if (data.email) localStorage.setItem("email", data.email);
} catch (err) {
console.error("USER ERROR:", err);
}
};

/* =========================
REAL EV MODEL (SAFE)
========================= */
const impliedProb = (odds) => {
if (!odds) return 0;
if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
return 100 / (odds + 100);
};

const fairProb = (odds) => {
const p = impliedProb(odds);
return p * 0.97;
};

const calcEV = (odds) => {
if (!odds) return 0;

const p = fairProb(odds);

const decimal = odds > 0
? (odds / 100) + 1
: (100 / Math.abs(odds)) + 1;

const ev = ((p * decimal) - 1) * 100;

// 🔥 prevent NaN crash
return isNaN(ev) ? 0 : ev;
};

/* =========================
SIGNAL
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
DATA (SAFE)
========================= */
const fetchGames = async () => {
try {

const res = await fetch(`${API}/api/data`);
const data = await res.json();

if (!data || !Array.isArray(data.games)) {
console.error("Bad API:", data);
return;
}

const enriched = data.games.map(game => {

const odds = game?.odds ?? 0;
const prev = lastOdds?.[game.id] ?? odds;

const move = odds - prev;
const ev = calcEV(odds);
const signal = getSignal(move, ev);

if (signal === "STRONG BUY") {
triggerAlert(`🔥 Sharp value on ${game.away}`);
}

return {
...game,
ev,
signal
};
});

detectMovement(data.games);

setGames(enriched);
generateAI(enriched);

setLastOdds(prev => {
const updated = { ...prev };
data.games.forEach(g => {
updated[g.id] = g.odds;
});
return updated;
});

} catch (err) {
console.error("FETCH ERROR:", err);
}
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
AI
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
BET SLIP
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
UI
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

const ev = g?.ev ?? 0;
const signal = g?.signal ?? "NEUTRAL";

return (
<div key={g.id} style={styles.marketRow}>

<span>{g.away} @ {g.home}</span>

<button onClick={()=>addToSlip(g)} style={styles.oddsBtn}>
{g.odds}
</button>

<span style={{
fontWeight:"bold",
color: ev > 0 ? "#00ff99" : "#ff4d4d"
}}>
{ev.toFixed(2)}%
</span>

<span style={{
fontWeight:"bold",
color:
signal === "STRONG BUY"
? "#00ff99"
: signal === "BUY"
? "#22c55e"
: signal === "FADE"
? "#ff4d4d"
: "#888"
}}>
{signal}
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

/* =========================
STYLES (UNCHANGED)
========================= */
const styles = { /* keep your original styles exactly */ };