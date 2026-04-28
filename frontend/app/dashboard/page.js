"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

/* ========================= STATE ========================= */
const [games, setGames] = useState([]);
const [user, setUser] = useState(null);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [lineHistory, setLineHistory] = useState({});
const [aiParlay, setAiParlay] = useState([]);
const [alerts, setAlerts] = useState([]);
const [betHistory, setBetHistory] = useState([]);

const [alertSound, setAlertSound] = useState(null);
const [lastSoundTime, setLastSoundTime] = useState(0);

/* ========================= INIT ========================= */
useEffect(() => {
fetchUser();
fetchGames();

const saved = localStorage.getItem("kbetz_history");
if (saved) setBetHistory(JSON.parse(saved));

const interval = setInterval(fetchGames, 5000);
return () => clearInterval(interval);
}, []);

useEffect(() => {
const sound = new Audio("/alert.mp3");
sound.volume = 0.7;
setAlertSound(sound);
}, []);

/* ========================= AUTH ========================= */
const fetchUser = async () => {
const token = localStorage.getItem("token");
if (!token) return (window.location.href = "/login");

const res = await fetch(`${API}/api/me`, {
headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
setUser(data);
};

/* ========================= UTILS ========================= */
const toDecimal = (odds) =>
odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;

const impliedProb = (odds) =>
odds < 0
? Math.abs(odds)/(Math.abs(odds)+100)
: 100/(odds+100);

/* ========================= EV ========================= */
const calcEV = (odds) => {
const p = impliedProb(odds) * 0.97;
return ((p * toDecimal(odds)) - 1) * 100;
};

/* ========================= ALERT ========================= */
const triggerAlert = (msg) => {
const now = Date.now();

if (alertSound && now - lastSoundTime > 2000) {
alertSound.currentTime = 0;
alertSound.play().catch(()=>{});
setLastSoundTime(now);
}

setAlerts(prev => [{ id: now, msg }, ...prev.slice(0, 4)]);
};

/* ========================= DATA ========================= */
const fetchGames = async () => {
const res = await fetch(`${API}/api/data`);
const data = await res.json();

const enriched = data.games.map(g => {

const prev = lastOdds[g.id] ?? g.odds;
const move = g.odds - prev;
const ev = calcEV(g.odds);

// sharp/public
const sharp = Math.floor(Math.random()*100);
const publicPct = 100 - sharp;

// line tracking
setLineHistory(prevHist => {
const updated = {...prevHist};
if (!updated[g.id]) updated[g.id] = [];
updated[g.id] = [...updated[g.id], { odds: g.odds }].slice(-12);
return updated;
});

if (ev > 2 && move < -3) {
triggerAlert(`🔥 ${g.away}`);
}

return {...g, ev, move, sharp, public: publicPct};
});

setGames(enriched);
setAiParlay(enriched.slice(0,2));

setLastOdds(prev=>{
const updated = {...prev};
enriched.forEach(g => updated[g.id] = g.odds);
return updated;
});
};

/* ========================= BET ========================= */
const addToSlip = (g)=>{
if (betSlip.find(b=>b.id===g.id)) return;
setBetSlip([...betSlip,g]);
};

const removeBet = (id)=>{
setBetSlip(betSlip.filter(b=>b.id!==id));
};

const parlayOdds = ()=> betSlip.reduce((a,b)=>a*toDecimal(b.odds),1);
const payout = ()=> (stake * parlayOdds()).toFixed(2);

/* ========================= HISTORY ========================= */
const placeBet = ()=>{
if(!betSlip.length) return;

const newBet = {
id: Date.now(),
bets: betSlip,
stake,
payout: payout(),
result: "pending"
};

const updated=[newBet,...betHistory];
setBetHistory(updated);
localStorage.setItem("kbetz_history",JSON.stringify(updated));
setBetSlip([]);
};

const gradeBet = (id,res)=>{
const updated = betHistory.map(b=>b.id===id?{...b,result:res}:b);
setBetHistory(updated);
localStorage.setItem("kbetz_history",JSON.stringify(updated));
};

/* ========================= STATS ========================= */
let staked=0,returned=0;
betHistory.forEach(b=>{
staked+=b.stake;
if(b.result==="win") returned+=parseFloat(b.payout);
});
const profit=returned-staked;
const roi=staked?((profit/staked)*100).toFixed(2):0;

/* ========================= UI ========================= */
if (!user) return <div style={{color:"white"}}>Loading...</div>;

return (
<div style={styles.page}>

{/* ALERTS */}
<div style={styles.alertBox}>
{alerts.map(a=>(
<div key={a.id} style={styles.alert}>{a.msg}</div>
))}
</div>

{/* LEFT SIDE */}
<div style={styles.left}>

<h1 style={styles.logo}>KBETZ ELITE</h1>

{/* PERFORMANCE */}
<div style={styles.card}>
<h2>📊 Performance</h2>
<div>Bets: {betHistory.length}</div>
<div>Profit: ${profit.toFixed(2)}</div>
<div>ROI: {roi}%</div>
</div>

{/* HEATMAP */}
<div style={styles.card}>
<h2>🔥 Heatmap</h2>
<div style={styles.heatmap}>
{games.map(g=>(
<div key={g.id} style={{
...styles.heatTile,
background:g.ev>2?"#00ff99":g.ev>0?"#14532d":"#220000"
}}>
{g.away}
</div>
))}
</div>
</div>

{/* MARKETS */}
<div style={styles.card}>
<h2>📈 Markets</h2>

{games.map(g=>(
<div key={g.id} style={styles.marketRow}>

<div>
<div>{g.away} @ {g.home}</div>
<div style={styles.sub}>DK: {g.books?.[0]?.odds} | FD: {g.books?.[1]?.odds}</div>
<div style={styles.sub}>Sharp {g.sharp}% / Public {g.public}%</div>
</div>

<button
onClick={()=>addToSlip(g)}
style={{
...styles.oddsBtn,
background:g.move<0?"#002211":"#220000"
}}
>
{g.odds}
</button>

<ResponsiveContainer width={120} height={50}>
<LineChart data={lineHistory[g.id] || []}>
<Line dataKey="odds" stroke="#00ff99" dot={false}/>
</LineChart>
</ResponsiveContainer>

</div>
))}
</div>

{/* AI PARLAY */}
<div style={styles.card}>
<h2>🧠 AI Parlay</h2>
{aiParlay.map((g,i)=>(
<div key={i}>{g.away}</div>
))}
</div>

{/* HISTORY */}
<div style={styles.card}>
<h2>🧾 Bet History</h2>
{betHistory.map(b=>(
<div key={b.id}>
{b.stake} → {b.payout}
<button onClick={()=>gradeBet(b.id,"win")}>Win</button>
<button onClick={()=>gradeBet(b.id,"loss")}>Loss</button>
</div>
))}
</div>

</div>

{/* RIGHT PANEL */}
<div style={styles.right}>

<h3>Bet Slip</h3>

{betSlip.map(b=>(
<div key={b.id}>
{b.away}
<button onClick={()=>removeBet(b.id)}>✖</button>
</div>
))}

<input
value={stake}
onChange={e=>setStake(Number(e.target.value))}
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

/* ========================= STYLES ========================= */
const styles = {
page:{display:"flex",background:"#050505",color:"white",fontFamily:"Inter"},
left:{flex:1,padding:"20px"},
right:{width:"300px",background:"#0a0a0a",padding:"20px"},
logo:{fontSize:"28px",marginBottom:"20px",color:"#00ff99"},
card:{background:"#111",padding:"15px",borderRadius:"10px",marginBottom:"15px"},
marketRow:{display:"flex",justifyContent:"space-between",marginBottom:"10px"},
sub:{fontSize:"11px",opacity:0.7},
oddsBtn:{padding:"6px 12px",borderRadius:"6px"},
heatmap:{display:"flex",flexWrap:"wrap"},
heatTile:{padding:"5px",margin:"2px",fontSize:"10px"},
input:{width:"100%",padding:"8px",marginTop:"10px",background:"#111",color:"white"},
placeBtn:{marginTop:"10px",width:"100%",padding:"10px",background:"#00ff99",border:"none"},
alertBox:{position:"fixed",top:"20px",right:"20px"},
alert:{background:"#111",padding:"10px",marginBottom:"5px"}
};