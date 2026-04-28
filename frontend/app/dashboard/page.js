"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [user, setUser] = useState(null);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [lineHistory, setLineHistory] = useState({});
const [aiParlay, setAiParlay] = useState([]);
const [aiPicks, setAiPicks] = useState([]);
const [alerts, setAlerts] = useState([]);
const [betHistory, setBetHistory] = useState([]);

const [alertSound, setAlertSound] = useState(null);
const [tickSound, setTickSound] = useState(null);
const [lastSoundTime, setLastSoundTime] = useState(0);

const [loadingUpgrade, setLoadingUpgrade] = useState(false);

/* ================= PRO ================= */
const isPro = false; // change later

/* ================= INIT ================= */
useEffect(() => {
fetchUser();
fetchGames();

const saved = localStorage.getItem("kbetz_history");
if (saved) setBetHistory(JSON.parse(saved));

const interval = setInterval(fetchGames, 5000);
return () => clearInterval(interval);
}, []);

useEffect(() => {
const alert = new Audio("/alert.mp3");
alert.volume = 0.7;
setAlertSound(alert);

const tick = new Audio("/tick.mp3");
tick.volume = 0.25;
setTickSound(tick);
}, []);

/* ================= AUTH ================= */
const fetchUser = async () => {
const token = localStorage.getItem("token");
if (!token) return;

const res = await fetch(`${API}/api/me`, {
headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
setUser(data);
};

const handleLogout = () => {
localStorage.removeItem("token");
window.location.href = "/login";
};

const handleUpgrade = async () => {
setLoadingUpgrade(true);
const res = await fetch(`${API}/api/checkout`, { method:"POST" });
const data = await res.json();
if (data.url) window.location.href = data.url;
setLoadingUpgrade(false);
};

/* ================= PRO LOCK ================= */
const ProLock = ({ children }) => {
if (isPro) return children;

return (
<div style={{ position:"relative" }}>
<div style={styles.blur}>{children}</div>

<div style={styles.lockOverlay}>
<div style={styles.lockBox}>
<h3>🔒 PRO Feature</h3>
<button onClick={handleUpgrade} style={styles.upgradeBtn}>
Upgrade
</button>
</div>
</div>
</div>
);
};

/* ================= UTILS ================= */
const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

const calcEV = (odds)=>{
const p = 1/toDecimal(odds)*0.97;
return ((p*toDecimal(odds))-1)*100;
};

/* ================= DATA ================= */
const fetchGames = async ()=>{
const res = await fetch(`${API}/api/data`);
const data = await res.json();

const enriched = data.games.map(g=>{

const prev = lastOdds[g.id] ?? g.odds;
const move = g.odds - prev;

if(move!==0 && tickSound){
tickSound.currentTime=0;
tickSound.play().catch(()=>{});
}

const ev = calcEV(g.odds);

const sharp = Math.floor(Math.random()*100);
const publicPct = 100-sharp;

setLineHistory(prev=>{
const h={...prev};
if(!h[g.id]) h[g.id]=[];
h[g.id]=[...h[g.id],{odds:g.odds}].slice(-12);
return h;
});

if(ev>2 && move<-3){
if(alertSound && Date.now()-lastSoundTime>2000){
alertSound.play().catch(()=>{});
setLastSoundTime(Date.now());
setAlerts(a=>[{msg:`🔥 ${g.away} sharp move`},...a.slice(0,4)]);
}
}

return {...g,move,ev,sharp,public:publicPct};
});

setGames(enriched);
setAiParlay(enriched.slice(0,2));
setAiPicks(enriched.slice(0,3));

setLastOdds(prev=>{
const o={...prev};
enriched.forEach(g=>o[g.id]=g.odds);
return o;
});
};

/* ================= BET ================= */
const addToSlip = g=>{
if(betSlip.find(b=>b.id===g.id)) return;
setBetSlip([...betSlip,g]);
};

const removeBet = id=>{
setBetSlip(betSlip.filter(b=>b.id!==id));
};

const parlayOdds = ()=> betSlip.reduce((a,b)=>a*toDecimal(b.odds),1);
const payout = ()=> (stake*parlayOdds()).toFixed(2);

/* ================= HISTORY ================= */
const placeBet = ()=>{
if(!betSlip.length) return;

const newBet={
id:Date.now(),
bets:betSlip,
stake,
payout:payout(),
result:"pending"
};

const updated=[newBet,...betHistory];
setBetHistory(updated);
localStorage.setItem("kbetz_history",JSON.stringify(updated));
setBetSlip([]);
};

const gradeBet=(id,res)=>{
const updated=betHistory.map(b=>b.id===id?{...b,result:res}:b);
setBetHistory(updated);
localStorage.setItem("kbetz_history",JSON.stringify(updated));
};

/* ================= STATS ================= */
let staked=0,returned=0;
betHistory.forEach(b=>{
staked+=b.stake;
if(b.result==="win") returned+=parseFloat(b.payout);
});
const profit=returned-staked;
const roi=staked?((profit/staked)*100).toFixed(2):0;

/* ================= UI ================= */
return (
<div style={styles.page}>

{/* TICKER */}
<div style={styles.ticker}>
{games.slice(0,10).map(g=>(
<span key={g.id}>{g.away} {g.odds} | </span>
))}
</div>

{/* HEADER */}
<div style={styles.header}>
<h1 style={styles.logo}>KBETZ ELITE</h1>

<div style={styles.account}>
<span>{isPro?"PRO":"FREE"}</span>

{!isPro && (
<button onClick={handleUpgrade} style={styles.upgradeBtn}>
{loadingUpgrade?"Loading":"Upgrade"}
</button>
)}

<button onClick={handleLogout} style={styles.logoutBtn}>
Logout
</button>
</div>
</div>

{/* LEFT */}
<div style={styles.left}>

<div style={styles.card}>
<h2>📊 Performance</h2>
<div>Bets: {betHistory.length}</div>
<div>Profit: ${profit.toFixed(2)}</div>
<div>ROI: {roi}%</div>
</div>

<ProLock>
<div style={styles.card}>
<h2>📈 Markets</h2>
{games.map(g=>(
<div key={g.id} style={styles.row}>
<div>{g.away}</div>
<button onClick={()=>addToSlip(g)}>{g.odds}</button>
</div>
))}
</div>
</ProLock>

<div style={styles.card}>
<h2>🎯 AI Picks</h2>
{aiPicks.map((g,i)=>(<div key={i}>{g.away}</div>))}
</div>

<ProLock>
<div style={styles.card}>
<h2>🧠 AI Parlay</h2>
{aiParlay.map((g,i)=>(<div key={i}>{g.away}</div>))}
</div>
</ProLock>

<div style={styles.card}>
<h2>🧾 History</h2>
{betHistory.map(b=>(
<div key={b.id}>
{b.stake} → {b.payout}
<button onClick={()=>gradeBet(b.id,"win")}>Win</button>
<button onClick={()=>gradeBet(b.id,"loss")}>Loss</button>
</div>
))}
</div>

</div>

{/* RIGHT */}
<div style={styles.right}>
<h3>Bet Slip</h3>

{betSlip.map(b=>(
<div key={b.id}>
{b.away}
<button onClick={()=>removeBet(b.id)}>✖</button>
</div>
))}

<input value={stake} onChange={e=>setStake(e.target.value)} />
<div>Payout: ${payout()}</div>

<button onClick={placeBet}>Place Bet</button>
</div>

{/* ALERTS */}
<div style={styles.alertBox}>
{alerts.map((a,i)=>(
<div key={i} style={styles.alert}>{a.msg}</div>
))}
</div>

</div>
);
}

/* ================= STYLES ================= */
const styles = {
page:{display:"flex",background:"#050505",color:"white",paddingTop:"30px"},
left:{flex:1,padding:"20px"},
right:{width:"300px",background:"#0a0a0a",padding:"20px"},
header:{display:"flex",justifyContent:"space-between",padding:"20px"},
logo:{color:"#00ff99"},
account:{display:"flex",gap:"10px"},
upgradeBtn:{background:"#00ff99",padding:"6px"},
logoutBtn:{background:"#222",padding:"6px"},
card:{background:"#111",padding:"15px",marginBottom:"15px"},
row:{display:"flex",justifyContent:"space-between"},
ticker:{position:"fixed",top:0,width:"100%",background:"#000",padding:"5px"},
alertBox:{position:"fixed",top:"40px",right:"20px"},
alert:{background:"#111",padding:"10px",marginBottom:"5px"},
blur:{filter:"blur(6px)"},
lockOverlay:{
position:"absolute",top:0,left:0,width:"100%",height:"100%",
display:"flex",justifyContent:"center",alignItems:"center",pointerEvents:"none"
},
lockBox:{
background:"rgba(0,0,0,0.85)",
padding:"20px",
borderRadius:"10px",
border:"1px solid #00ff99",
pointerEvents:"auto"
}
};