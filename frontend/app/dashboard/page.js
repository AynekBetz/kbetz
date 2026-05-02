"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Dashboard() {

/* ================= EXISTING STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

const [lastOdds, setLastOdds] = useState({});
const [flashMap, setFlashMap] = useState({});
const [alerts, setAlerts] = useState([]);

/* ================= NEW STATE ================= */
const [isPro, setIsPro] = useState(false);
const [activeTab, setActiveTab] = useState("dashboard");

/* ================= INIT ================= */
useEffect(() => {
fetchGames();
checkPro();

const interval = setInterval(fetchGames, 10000);
return () => clearInterval(interval);
}, []);

/* ================= PRO CHECK ================= */
const checkPro = async () => {
try {
const email = localStorage.getItem("email");
if (!email) return;

const res = await fetch(`${API}/api/me?email=${email}`);
const data = await res.json();

setIsPro(data.isPro);
} catch {}
};

/* ================= FETCH GAMES ================= */
const fetchGames = async () => {
try {
const res = await fetch(`${API}/api/data`);
const data = await res.json();

const updated = data.games.map(g => {

const prev = lastOdds[g.id] ?? g.homeOdds;
const move = g.homeOdds - prev;

/* FLASH */
if (move !== 0) {
setFlashMap(p => ({
...p,
[g.id]: move > 0 ? "up" : "down"
}));

setTimeout(()=> {
setFlashMap(p => ({...p,[g.id]:null}));
},800);
}

/* ALERTS */
if (Math.abs(move) >= 0.2) {
setAlerts(a => [
{ id: Date.now()+g.id, text: `${g.home} moved ${move.toFixed(2)}` },
...a.slice(0,4)
]);
}

return { ...g, move };
});

setGames(updated);

setLastOdds(prev=>{
const copy = {...prev};
updated.forEach(g=>copy[g.id]=g.homeOdds);
return copy;
});

} catch {}
};

/* ================= STRIPE ================= */
const upgrade = async () => {
const email = localStorage.getItem("email");

const res = await fetch(`${API}/api/checkout`, {
method:"POST",
headers:{ "Content-Type":"application/json" },
body: JSON.stringify({ email })
});

const data = await res.json();
if (data.url) window.location.href = data.url;
};

const openBilling = async () => {
const email = localStorage.getItem("email");

const res = await fetch(`${API}/api/billing-portal`, {
method:"POST",
headers:{ "Content-Type":"application/json" },
body: JSON.stringify({ email })
});

const data = await res.json();
if (data.url) window.location.href = data.url;
};

/* ================= HELPERS ================= */

const toDecimal = (o)=> o>0?(o/100)+1:(100/Math.abs(o))+1;

const payout = ()=>{
const odds = betSlip.reduce((a,b)=>a*toDecimal(b.homeOdds||-110),1);
return (stake*odds).toFixed(2);
};

const addToSlip = (g)=>{
if(!g) return;
if(betSlip.find(b=>b.id===g.id)) return;
setBetSlip([...betSlip,g]);
};

/* ================= UI ================= */

return (

<div style={{ position:"relative", zIndex:1 }}>

<div style={styles.page}>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

{/* ALERT BAR */}
<div style={styles.alertBar}>
{alerts.map(a=>(
<div key={a.id} style={styles.alert}>{a.text}</div>
))}
</div>

{/* NAV */}
<div style={styles.nav}>
<button style={activeTab==="dashboard"?styles.activeBtn:styles.btn} onClick={()=>setActiveTab("dashboard")}>Dashboard</button>
<button style={activeTab==="billing"?styles.activeBtn:styles.btn} onClick={()=>setActiveTab("billing")}>Billing</button>
</div>

{/* DASHBOARD */}
{activeTab === "dashboard" && (

<div>

{/* PRO BANNER */}
{!isPro && (
<div style={styles.proBanner}>
Unlock AI picks, ROI & alerts
<button style={styles.upgradeBtn} onClick={upgrade}>Upgrade</button>
</div>
)}

{/* GAMES */}
<div style={styles.grid}>
{games.map(g => (

<div key={g.id} style={{
...styles.card,
...(flashMap[g.id]==="up" && styles.flashUp),
...(flashMap[g.id]==="down" && styles.flashDown)
}}>

<div style={styles.match}>
{g.away} <span style={{opacity:.5}}>vs</span> {g.home}
</div>

<div style={styles.meta}>

<span style={styles.odds}>{g.homeOdds}</span>

<span style={{
color: isPro ? "#00ffcc" : "#666"
}}>
{isPro ? `+${g.ev}% EV` : "🔒"} </span>

</div>

<button style={styles.oddsBtn} onClick={()=>addToSlip(g)}>
Add
</button>

</div>

))}
</div>

{/* BET SLIP */}
<div style={styles.slip}>
<h3>Bet Slip</h3>
{betSlip.map(b => <div key={b.id}>{b.home}</div>)}
<input value={stake} onChange={e=>setStake(Number(e.target.value))}/>
<div>${payout()}</div>
</div>

</div>

)}

{/* BILLING */}
{activeTab === "billing" && (

<div style={styles.billingBox}>

<h2>Subscription</h2>

<div style={{
color: isPro ? "#22c55e" : "#ef4444",
fontWeight:"bold",
marginBottom:"20px"
}}>
{isPro ? "ACTIVE (PRO)" : "FREE PLAN"}
</div>

{!isPro ? ( <button style={styles.upgradeBtn} onClick={upgrade}>
Upgrade to PRO </button>
) : ( <button style={styles.manageBtn} onClick={openBilling}>
Manage Billing </button>
)}

</div>

)}

</div>
</div>
);
}

/* ================= STYLES ================= */

const styles = {

page:{
background:"#050505",
color:"white",
padding:"20px",
minHeight:"100vh",
position:"relative",
zIndex:1
},

logo:{
fontSize:"30px",
fontWeight:"900",
background:"linear-gradient(90deg,#a855f7,#00ff99)",
WebkitBackgroundClip:"text",
WebkitTextFillColor:"transparent",
marginBottom:"10px"
},

alertBar:{
display:"flex",
gap:"10px",
marginBottom:"10px"
},

alert:{
background:"#111",
padding:"6px 10px",
borderRadius:"6px",
fontSize:"12px"
},

nav:{
marginBottom:"20px"
},

btn:{
pointerEvents:"auto",
zIndex:10,
marginRight:"10px",
padding:"10px",
background:"#111",
color:"#aaa",
border:"1px solid #222",
cursor:"pointer"
},

activeBtn:{
pointerEvents:"auto",
zIndex:10,
marginRight:"10px",
padding:"10px",
background:"#22c55e",
color:"#000",
border:"none",
cursor:"pointer"
},

grid:{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",
gap:"12px"
},

card:{
background:"rgba(255,255,255,0.05)",
backdropFilter:"blur(12px)",
padding:"15px",
borderRadius:"12px",
border:"1px solid rgba(255,255,255,0.08)",
transition:"0.2s",
position:"relative",
zIndex:1
},

match:{
fontWeight:"bold",
marginBottom:"10px"
},

meta:{
display:"flex",
justifyContent:"space-between",
marginBottom:"10px"
},

odds:{
color:"#22c55e",
fontWeight:"bold"
},

oddsBtn:{
pointerEvents:"auto",
zIndex:10,
background:"#22c55e",
color:"#000",
padding:"8px",
border:"none",
cursor:"pointer",
width:"100%"
},

flashUp:{ border:"1px solid #22c55e" },
flashDown:{ border:"1px solid #ef4444" },

proBanner:{
background:"#111",
padding:"10px",
marginBottom:"20px",
display:"flex",
justifyContent:"space-between",
alignItems:"center"
},

upgradeBtn:{
pointerEvents:"auto",
zIndex:10,
background:"#22c55e",
color:"#000",
padding:"10px",
border:"none",
cursor:"pointer"
},

manageBtn:{
pointerEvents:"auto",
zIndex:10,
background:"#3b82f6",
color:"#fff",
padding:"10px",
border:"none",
cursor:"pointer"
},

slip:{
marginTop:"20px",
background:"#111",
padding:"10px",
borderRadius:"10px"
},

billingBox:{
background:"#111",
padding:"20px",
borderRadius:"12px"
}

};