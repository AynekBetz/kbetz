"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [user, setUser] = useState(null);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [alerts, setAlerts] = useState([]);
const [lastOdds, setLastOdds] = useState({});
const [aiParlay, setAiParlay] = useState([]);

const isPro = user?.isPro === true || user?.plan === "pro";

/* =========================
INIT
========================= */
useEffect(() => {
fetchUser();
fetchGames();
const interval = setInterval(fetchGames, 5000);
return () => clearInterval(interval);
}, []);

/* =========================
AUTH
========================= */
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
} catch {}
};

/* =========================
UTILS
========================= */
const impliedProb = (odds) => {
if (!odds) return 0;
if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
return 100 / (odds + 100);
};

const toDecimal = (odds) => {
return odds > 0
? (odds / 100) + 1
: (100 / Math.abs(odds)) + 1;
};

/* =========================
MULTI BOOK
========================= */
const getBestOdds = (books) => {
if (!books?.length) return null;

return books.reduce((best, b) => {
return toDecimal(b.odds) > toDecimal(best.odds) ? b : best;
});
};

const getMarketOdds = (books) => {
if (!books?.length) return 0;
return books.reduce((sum, b) => sum + b.odds, 0) / books.length;
};

const calcEV = (bestOdds, marketOdds) => {
if (!bestOdds || !marketOdds) return 0;

const p = impliedProb(marketOdds);
const dec = toDecimal(bestOdds);

const ev = ((p * dec) - 1) * 100;
return isNaN(ev) ? 0 : ev;
};

/* =========================
SHARP SIGNAL
========================= */
const getSharpSignal = (books, move) => {
if (!books || books.length < 2) return "NEUTRAL";

const oddsList = books.map(b => b.odds);
const spread = Math.max(...oddsList) - Math.min(...oddsList);

if (spread > 15 && move < -5) return "SHARP BUY";
if (spread > 10) return "BOOK DISAGREE";

return "NEUTRAL";
};

/* =========================
DATA
========================= */
const fetchGames = async () => {
try {
const res = await fetch(`${API}/api/data`);
const data = await res.json();

if (!data?.games) return;

const enriched = data.games.map(g => {

const books = g.books?.length
? g.books
: [{ name: "default", odds: g.odds }];

const best = getBestOdds(books);
const market = getMarketOdds(books);

const prev = lastOdds[g.id] ?? best?.odds ?? 0;
const move = (best?.odds ?? 0) - prev;

const ev = calcEV(best?.odds, market);
const signal = getSharpSignal(books, move);

return {
...g,
bestOdds: best?.odds ?? 0,
marketOdds: market,
books,
ev,
signal
};
});

setGames(enriched);

setLastOdds(prev => {
const updated = { ...prev };
enriched.forEach(g => {
updated[g.id] = g.bestOdds;
});
return updated;
});

// AI
setAiParlay(enriched.slice(0, 2));

} catch (e) {
console.error(e);
}
};

/* =========================
BET SLIP
========================= */
const addToSlip = (g) => {
if (betSlip.find(b => b.id === g.id)) return;
setBetSlip([...betSlip, g]);
};

const removeBet = (id) => {
setBetSlip(betSlip.filter(b => b.id !== id));
};

const parlayOdds = () => {
if (!betSlip.length) return 0;

return betSlip.reduce((acc, b) => {
return acc * toDecimal(b.bestOdds);
}, 1);
};

const payout = () => {
return (stake * parlayOdds()).toFixed(2);
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

{/* ALERTS */}
<div style={styles.alertBox}>
{alerts.map(a => (
<div key={a.id} style={styles.alert}>{a.msg}</div>
))}
</div>

<div style={{flex:1}}>

{/* HEADER */}
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

{/* AI PARLAY */}
<div style={styles.card}>
<h2>🧠 AI PARLAY</h2>

{aiParlay.map((g,i)=>(
<div key={i} style={{display:"flex", justifyContent:"space-between"}}>
<span>{g.away} @ {g.home}</span>
<span>{Math.floor(Math.random()*20+70)}%</span>
</div>
))}

<button style={styles.aiBtn} onClick={()=>setBetSlip(aiParlay)}>
Add AI Parlay
</button>
</div>

{/* MARKETS */}
<div style={styles.card}>
<h2>📈 LIVE MARKETS</h2>

{games.map(g => (
<div key={g.id} style={styles.marketRow}>

<div>
<div>{g.away} @ {g.home}</div>
<div style={styles.books}>
{g.books.map(b => (
<span key={b.name}>{b.name}: {b.odds}</span>
))}
</div>
</div>

<button onClick={()=>addToSlip(g)} style={styles.oddsBtn}>
{g.bestOdds}
</button>

<span style={{
fontWeight:"bold",
color: g.ev > 0 ? "#00ff99" : "#ff4d4d"
}}>
{g.ev.toFixed(2)}%
</span>

<span style={{
fontWeight:"bold",
color:
g.signal === "SHARP BUY"
? "#00ff99"
: g.signal === "BOOK DISAGREE"
? "#ffaa00"
: "#888"
}}>
{g.signal}
</span>

</div>
))}

</div>

</div>

{/* BET SLIP */}
<div style={styles.slip}>
<h3>🧾 Bet Slip</h3>

{betSlip.map(b => (
<div key={b.id} style={styles.slipItem}>
<span>{b.away}</span>
<button onClick={()=>removeBet(b.id)}>✖</button>
</div>
))}

<input
type="number"
value={stake}
onChange={(e)=>setStake(Number(e.target.value))}
style={styles.input}
/>

<div>Odds: {parlayOdds().toFixed(2)}x</div>
<div>Payout: ${payout()}</div>

<button style={styles.placeBtn}>
Place Bet
</button>

</div>

</div>
);
}

/* =========================
STYLES
========================= */
const styles = {

page:{ display:"flex", background:"#050505", color:"white", minHeight:"100vh", padding:"20px", fontFamily:"Inter" },

header:{ display:"flex", justifyContent:"space-between", marginBottom:"20px" },

logo:{ fontSize:"28px", background:"linear-gradient(90deg,#00ff99,#00cc66)", WebkitBackgroundClip:"text", color:"transparent" },

right:{ display:"flex", gap:"10px" },

card:{
background:"linear-gradient(135deg,#1a1a1a,#0a0a0a)",
padding:"20px",
borderRadius:"14px",
border:"1px solid rgba(0,255,100,0.1)",
boxShadow:"0 0 20px rgba(0,255,100,0.1)",
marginBottom:"20px"
},

marketRow:{
display:"flex",
justifyContent:"space-between",
padding:"12px",
borderBottom:"1px solid #222",
alignItems:"center"
},

books:{ fontSize:"10px", opacity:0.6 },

oddsBtn:{
background:"#111",
border:"1px solid #333",
padding:"6px 12px",
borderRadius:"6px",
cursor:"pointer"
},

slip:{
width:"320px",
background:"linear-gradient(180deg,#0a0a0a,#050505)",
padding:"15px",
borderRadius:"12px",
boxShadow:"0 0 25px rgba(0,255,100,0.15)",
position:"sticky",
top:"20px"
},

slipItem:{ display:"flex", justifyContent:"space-between", marginBottom:"8px" },

input:{ marginTop:"10px", width:"100%", background:"#111", color:"white", border:"1px solid #333", padding:"8px" },

placeBtn:{ marginTop:"10px", background:"#00ff99", border:"none", padding:"10px", width:"100%", borderRadius:"6px", fontWeight:"bold" },

btnPro:{ background:"gold", border:"none", padding:"8px 12px", borderRadius:"6px" },

aiBtn:{
marginTop:"10px",
background:"linear-gradient(90deg,#00ff99,#00cc66)",
border:"none",
padding:"10px",
borderRadius:"8px",
fontWeight:"bold"
},

alertBox:{ position:"fixed", top:"20px", right:"20px" },

alert:{ background:"#111", padding:"8px", marginBottom:"5px", color:"#00ff99" }

};