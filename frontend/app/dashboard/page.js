"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

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

// 🔥 NEW
const [history, setHistory] = useState({});
const [sharp, setSharp] = useState({});

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
DATA
========================= */
const fetchGames = async () => {
const res = await fetch(`${API}/api/data`);
const data = await res.json();
const g = data.games || [];

// 🔥 NEW FEATURES
updateHistory(g);
detectSharp(g);

detectMovement(g);
setGames(g);
generateAI(g);
};

/* =========================
HISTORY (CHART)
========================= */
const updateHistory = (games) => {
setHistory(prev => {
const updated = {...prev};

games.forEach(g => {
if (!updated[g.id]) updated[g.id] = [];

updated[g.id].push({
time: Date.now(),
odds: g.odds
});

if (updated[g.id].length > 20) updated[g.id].shift();
});

return updated;
});
};

/* =========================
SHARP MONEY
========================= */
const detectSharp = (games) => {
setSharp(prev => {
const updated = {...prev};

games.forEach(g => {
const hist = history[g.id];
if (!hist || hist.length < 3) return;

const move = hist[hist.length - 1].odds - hist[0].odds;

if (Math.abs(move) > 10) {
updated[g.id] = move > 0 ? "sharp-up" : "sharp-down";
} else {
updated[g.id] = "normal";
}
});

return updated;
});
};

/* =========================
ODDS MOVEMENT + SOUND
========================= */
const detectMovement = (games) => {
const now = Date.now();

games.forEach(g => {
const prev = lastOdds[g.id];

if (prev && prev !== g.odds) {
if (now - lastSoundTime > 2000) {
new Audio("/alert.mp3").play();
setLastSoundTime(now);
}
}
});

setLastOdds(prev => {
const updated = {...prev};
games.forEach(g => {
updated[g.id] = g.odds;
});
return updated;
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
BET SLIP (UNCHANGED)
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
UI
========================= */
if (!user) return <div style={{color:"white"}}>Loading...</div>;

return (

<div style={styles.page}>

<div style={{flex:1}}>

<h1 style={styles.logo}>KBETZ ELITE</h1>

{/* 🔥 HEATMAP */}
<div style={styles.card}>
<h2>🔥 Market Heatmap</h2>

<div style={styles.heatmap}>
{games.map(g => {
const s = sharp[g.id];

return (
<div
key={g.id}
style={{
...styles.heatBox,
background:
s === "sharp-up"
? "rgba(0,255,100,0.4)"
: s === "sharp-down"
? "rgba(255,50,50,0.4)"
: "rgba(255,255,255,0.05)"
}}
>
{g.away}
</div>
);
})}
</div>
</div>

{/* LIVE MARKETS */}
<div style={styles.card}>
<h2>📈 Live Markets</h2>

{games.map(g => {

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
transition: "0.2s"
}}
>
{g.odds}
</button>

{/* SHARP LABEL */}
<span style={{
fontSize:"10px",
color:
sharp[g.id] === "sharp-up"
? "#00ff99"
: sharp[g.id] === "sharp-down"
? "#ff4d4d"
: "#888"
}}>
{sharp[g.id]}
</span>

{/* MINI CHART */}
<div style={{width:"120px", height:"40px"}}>
<ResponsiveContainer>
<LineChart data={history[g.id] || []}>
<XAxis dataKey="time" hide />
<YAxis hide />
<Tooltip />
<Line type="monotone" dataKey="odds" stroke="#00ff99" dot={false}/>
</LineChart>
</ResponsiveContainer>
</div>

</div>
);
})}

</div>

</div>

{/* BET SLIP (UNCHANGED) */}
<div style={styles.slip}>
<h3>🧾 Bet Slip</h3>

{betSlip.map((b)=>(
<div key={b.id} style={styles.slipItem}>
<span>{b.away}</span>
<button onClick={()=>removeBet(b.id)}>✖</button>
</div>
))}

</div>

</div>
);
}

/* =========================
STYLES
========================= */

const styles = {
page:{ display:"flex", background:"#050505", color:"white", minHeight:"100vh", padding:"20px" },
logo:{ fontSize:"28px", marginBottom:"20px", color:"#00ff99" },
card:{ background:"#111", padding:"15px", borderRadius:"12px", marginBottom:"20px" },
heatmap:{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"6px" },
heatBox:{ padding:"10px", borderRadius:"6px", textAlign:"center" },
marketRow:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px" },
oddsBtn:{ background:"#111", border:"1px solid #333", padding:"6px 10px" },
slip:{ width:"300px", background:"#0a0a0a", padding:"15px" },
slipItem:{ display:"flex", justifyContent:"space-between" }
};