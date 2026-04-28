"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

/* =========================
STATE
========================= */
const [games, setGames] = useState([]);
const [user, setUser] = useState(null);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [aiParlay, setAiParlay] = useState([]);
const [alerts, setAlerts] = useState([]);
const [arbOps, setArbOps] = useState([]);
const [betHistory, setBetHistory] = useState([]);

const isPro = user?.isPro === true || user?.plan === "pro";

/* =========================
INIT
========================= */
useEffect(() => {
fetchUser();
fetchGames();

// load history
const saved = localStorage.getItem("kbetz_history");
if (saved) setBetHistory(JSON.parse(saved));

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

} catch (err) {
console.error(err);
}
};

/* =========================
UTILS
========================= */
const toDecimal = (odds) => odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;

const impliedProb = (odds) => {
if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
return 100 / (odds + 100);
};

/* =========================
EV + SIGNAL
========================= */
const calcEV = (odds) => {
const p = impliedProb(odds) * 0.97;
return ((p * toDecimal(odds)) - 1) * 100;
};

const getSignal = (move, ev) => {
if (move < -5 && ev > 1) return "STRONG BUY";
if (move < -3 && ev > 0) return "BUY";
if (move > 5 && ev < 0) return "FADE";
return "NEUTRAL";
};

/* =========================
ALERT + SOUND
========================= */
const triggerAlert = (msg) => {
try { new Audio("/alert.mp3").play(); } catch {}

const id = Date.now();
setAlerts(prev => [{ id, msg }, ...prev.slice(0, 4)]);
};

/* =========================
ARBITRAGE + STAKE OPTIMIZER
========================= */
const findArbitrage = (games) => {

const arbs = [];

games.forEach(g => {

const books = g.books || [];
if (books.length < 2) return;

for (let i=0;i<books.length;i++){
for (let j=i+1;j<books.length;j++){

const a = books[i];
const b = books[j];

const d1 = toDecimal(a.odds);
const d2 = toDecimal(b.odds);

const total = (1/d1)+(1/d2);

if (total < 1){
const profit = ((1-total)*100).toFixed(2);

arbs.push({
game:g,
a,
b,
profit
});
}
}}
});

setArbOps(arbs);
};

const calcStake = (arb) => {

const d1 = toDecimal(arb.a.odds);
const d2 = toDecimal(arb.b.odds);
const total = (1/d1)+(1/d2);

const betA = (stake/d1)/total;
const betB = (stake/d2)/total;
const profit = (betA*d1) - stake;

return {
betA: betA.toFixed(2),
betB: betB.toFixed(2),
profit: profit.toFixed(2)
};
};

/* =========================
DATA
========================= */
const fetchGames = async () => {

const res = await fetch(`${API}/api/data`);
const data = await res.json();

const enriched = data.games.map(g => {

const prev = lastOdds[g.id] ?? g.odds;
const move = g.odds - prev;
const ev = calcEV(g.odds);
const signal = getSignal(move, ev);

if (signal === "STRONG BUY") {
triggerAlert(`🔥 Sharp value: ${g.away}`);
}

return {...g, ev, signal};
});

setGames(enriched);
setAiParlay(enriched.slice(0,2));
findArbitrage(enriched);

setLastOdds(prev=>{
const updated = {...prev};
enriched.forEach(g => updated[g.id] = g.odds);
return updated;
});
};

/* =========================
BET LOGIC
========================= */
const addToSlip = (g)=>{
if (betSlip.find(b=>b.id===g.id)) return;
setBetSlip([...betSlip,g]);
};

const addArbToSlip = (arb)=>{
setBetSlip([
{ id: arb.game.id+"_A", away: arb.game.away, odds: arb.a.odds },
{ id: arb.game.id+"_B", away: arb.game.home, odds: arb.b.odds }
]);
};

const removeBet = (id)=>{
setBetSlip(betSlip.filter(b=>b.id!==id));
};

const parlayOdds = ()=> betSlip.reduce((acc,b)=>acc*toDecimal(b.odds),1);
const payout = ()=> (stake * parlayOdds()).toFixed(2);

/* =========================
BET HISTORY + ROI
========================= */
const placeBet = ()=>{

if (!betSlip.length) return;

const newBet = {
id: Date.now(),
bets: betSlip,
stake,
odds: parlayOdds(),
payout: payout(),
result: "pending",
date: new Date().toISOString()
};

const updated=[newBet,...betHistory];
setBetHistory(updated);
localStorage.setItem("kbetz_history", JSON.stringify(updated));
setBetSlip([]);
};

const gradeBet = (id, result)=>{
const updated = betHistory.map(b=>{
if (b.id===id) return {...b, result};
return b;
});
setBetHistory(updated);
localStorage.setItem("kbetz_history", JSON.stringify(updated));
};

const stats = (()=>{

let staked=0;
let returned=0;

betHistory.forEach(b=>{
staked+=b.stake;
if (b.result==="win") returned+=parseFloat(b.payout);
});

const profit = returned - staked;
const roi = staked>0 ? (profit/staked)*100 : 0;

return {
profit: profit.toFixed(2),
roi: roi.toFixed(2),
bets: betHistory.length
};
})();

/* =========================
UI
========================= */
if (!user) return <div style={{color:"white"}}>Loading...</div>;

return (
<div style={styles.page}>

{/* ALERTS */}
<div style={styles.alertBox}>
{alerts.map(a=>(
<div key={a.id} style={styles.alert}>{a.msg}</div>
))}
</div>

<div style={{flex:1}}>

{/* HEADER */}
<div style={styles.header}>
<h1 style={styles.logo}>KBETZ ELITE</h1>

<div style={styles.right}>
<span>{isPro ? "PRO" : "FREE"}</span>
</div>
</div>

{/* ANALYTICS */}
<div style={styles.card}>
<h2>📊 PERFORMANCE</h2>
<div>Bets: {stats.bets}</div>
<div>Profit: ${stats.profit}</div>
<div>ROI: {stats.roi}%</div>
</div>

{/* ARBITRAGE */}
<div style={styles.card}>
<h2>💰 ARBITRAGE</h2>

{arbOps.map((arb,i)=>{
const s = calcStake(arb);

return (
<div key={i} style={styles.marketRow}>

<div>
<div>{arb.game.away} @ {arb.game.home}</div>

<div style={{fontSize:"11px", opacity:0.7}}>
{arb.a.name}: {arb.a.odds} | {arb.b.name}: {arb.b.odds}
</div>

<div style={{fontSize:"11px"}}>
Bet A: ${s.betA} | Bet B: ${s.betB}
</div>
</div>

<div style={{color:"#00ff99"}}>
+${s.profit}
</div>

<button onClick={()=>addArbToSlip(arb)} style={styles.oddsBtn}>
Auto Bet
</button>

</div>
);
})}

</div>

{/* AI */}
<div style={styles.card}>
<h2>🧠 AI PARLAY</h2>
{aiParlay.map((g,i)=>(
<div key={i}>
{g.away} @ {g.home}
</div>
))}
<button onClick={()=>setBetSlip(aiParlay)} style={styles.aiBtn}>
Add AI Parlay
</button>
</div>

{/* MARKETS */}
<div style={styles.card}>
<h2>📈 MARKETS</h2>

{games.map(g=>(
<div key={g.id} style={styles.marketRow}>
<span>{g.away}</span>

<button onClick={()=>addToSlip(g)} style={styles.oddsBtn}>
{g.odds}
</button>

<span style={{color:g.ev>0?"#00ff99":"#ff4d4d"}}>
{g.ev.toFixed(2)}%
</span>

<span>{g.signal}</span>
</div>
))}

</div>

{/* HISTORY */}
<div style={styles.card}>
<h2>🧾 HISTORY</h2>

{betHistory.map(b=>(
<div key={b.id}>
Stake ${b.stake} → ${b.payout}

<button onClick={()=>gradeBet(b.id,"win")}>Win</button>
<button onClick={()=>gradeBet(b.id,"loss")}>Loss</button>
</div>
))}

</div>

</div>

{/* BET SLIP */}
<div style={styles.slip}>
<h3>Bet Slip</h3>

{betSlip.map(b=>(
<div key={b.id}>
{b.away} ({b.odds})
<button onClick={()=>removeBet(b.id)}>✖</button>
</div>
))}

<input
value={stake}
onChange={(e)=>setStake(Number(e.target.value))}
style={styles.input}
/>

<div>Payout: ${payout()}</div>

<button onClick={placeBet} style={styles.placeBtn}>
Place Bet
</button>
</div>

</div>
);
}

/* =========================
STYLES (ELITE BASE)
========================= */
const styles = {

page:{
display:"flex",
background:"#050505",
color:"white",
padding:"20px",
fontFamily:"Inter"
},

header:{
display:"flex",
justifyContent:"space-between",
marginBottom:"20px"
},

logo:{
fontSize:"28px",
background:"linear-gradient(90deg,#00ff99,#00cc66)",
WebkitBackgroundClip:"text",
color:"transparent"
},

right:{display:"flex",gap:"10px"},

card:{
background:"linear-gradient(135deg,#1a1a1a,#0a0a0a)",
padding:"20px",
borderRadius:"12px",
marginBottom:"15px",
boxShadow:"0 0 20px rgba(0,255,100,0.1)"
},

marketRow:{
display:"flex",
justifyContent:"space-between",
padding:"10px",
borderBottom:"1px solid #222"
},

oddsBtn:{
background:"#111",
border:"1px solid #333",
padding:"6px 12px",
borderRadius:"6px",
cursor:"pointer"
},

slip:{
width:"300px",
background:"#0a0a0a",
padding:"15px",
borderRadius:"10px"
},

input:{
width:"100%",
background:"#111",
color:"white",
border:"1px solid #333",
padding:"8px",
marginTop:"10px"
},

placeBtn:{
marginTop:"10px",
background:"#00ff99",
border:"none",
padding:"10px",
width:"100%",
borderRadius:"6px",
fontWeight:"bold"
},

aiBtn:{
marginTop:"10px",
background:"#00ff99",
border:"none",
padding:"8px",
borderRadius:"6px"
},

alertBox:{
position:"fixed",
top:"20px",
right:"20px"
},

alert:{
background:"#111",
padding:"10px",
marginBottom:"5px",
color:"#00ff99",
borderRadius:"6px"
}

};