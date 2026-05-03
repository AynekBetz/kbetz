"use client";

import { useEffect, useState } from "react";
import "../../styles/kbetz.css";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

const [lastOdds, setLastOdds] = useState({});
const [flashMap, setFlashMap] = useState({});
const [alerts, setAlerts] = useState([]);

const [isPro, setIsPro] = useState(false);
const [activeTab, setActiveTab] = useState("dashboard");

/* ================= INIT ================= */
useEffect(() => {
  fetchGames();
  checkPro();

  const interval = setInterval(fetchGames, 10000);
  return () => clearInterval(interval);
}, []);

/* ================= PRO ================= */
const checkPro = async () => {
  try {
    const email = localStorage.getItem("email");
    if (!email) return;

    const res = await fetch(`${API}/api/me?email=${email}`);
    const data = await res.json();

    setIsPro(data.isPro);
  } catch {}
};

/* ================= DATA ================= */
const fetchGames = async () => {
  try {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    const updated = data.games.map(g => {

      const prev = lastOdds[g.id] ?? g.homeOdds;
      const move = g.homeOdds - prev;

      if (move !== 0) {
        setFlashMap(p => ({
          ...p,
          [g.id]: move > 0 ? "up" : "down"
        }));

        setTimeout(()=>{
          setFlashMap(p => ({...p,[g.id]:null}));
        },800);
      }

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
<div style={{padding:"20px"}}>

<h1 className="kbetz-logo">KBETZ TERMINAL</h1>

{/* ALERTS */}
<div style={{display:"flex",gap:"10px",marginBottom:"15px"}}>
{alerts.map(a=>(
<div key={a.id} className="glass" style={{padding:"6px 10px"}}>
{a.text}
</div>
))}
</div>

{/* NAV */}
<div style={{marginBottom:"20px"}}>
<button
className={`btn ${activeTab==="dashboard"?"nav-active":"nav-btn"}`}
onClick={()=>setActiveTab("dashboard")}
>
Dashboard
</button>

<button
className={`btn ${activeTab==="billing"?"nav-active":"nav-btn"}`}
onClick={()=>setActiveTab("billing")}
>
Billing
</button>
</div>

{/* DASHBOARD */}
{activeTab==="dashboard" && (

<div>

{/* PRO BANNER */}
{!isPro && (
<div className="glass" style={{
padding:"12px",
marginBottom:"20px",
display:"flex",
justifyContent:"space-between"
}}>
Unlock AI picks, ROI & alerts
<button className="btn btn-gradient" onClick={upgrade}>
Upgrade
</button>
</div>
)}

{/* GAMES */}
<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",
gap:"16px"
}}>

{games.map(g => (

<div key={g.id}
className={`glass ${
flashMap[g.id]==="up" ? "flash-up" :
flashMap[g.id]==="down" ? "flash-down" : ""
}`}
style={{padding:"16px"}}
>

<div style={{marginBottom:"10px"}}>
{g.away} vs {g.home}
</div>

<div style={{
display:"flex",
justifyContent:"space-between",
marginBottom:"10px"
}}>

<span className="odds">
{g.homeOdds}

{g.move !== 0 && (
<span style={{
marginLeft:"6px",
color: g.move > 0 ? "#00ffcc" : "#ff4d4d",
fontSize:"12px"
}}>
{g.move > 0 ? "▲" : "▼"}
</span>
)}

</span>

<span style={{
filter: isPro ? "none" : "blur(4px)"
}}>
+{g.ev}% EV
</span>

</div>

<button
className="btn btn-primary"
onClick={()=>addToSlip(g)}
>
Add
</button>

</div>

))}

</div>

{/* BET SLIP */}
<div className="glass bet-slip">

<h3>Bet Slip</h3>

{betSlip.map(b => (
<div key={b.id}>{b.home}</div>
))}

<input
value={stake}
onChange={e=>setStake(Number(e.target.value))}
style={{width:"100%",marginTop:"10px"}}
/>

<div style={{marginTop:"10px"}}>
${payout()}
</div>

</div>

</div>
)}

{/* BILLING */}
{activeTab==="billing" && (

<div className="glass" style={{padding:"20px"}}>

<h2>Subscription</h2>

<div style={{
color: isPro ? "#00ffcc" : "#ff4d4d",
marginBottom:"20px"
}}>
{isPro ? "PRO ACTIVE" : "FREE PLAN"}
</div>

{!isPro ? (
<button className="btn btn-gradient" onClick={upgrade}>
Upgrade
</button>
) : (
<button className="btn btn-primary" onClick={openBilling}>
Manage Billing
</button>
)}

</div>

)}

</div>
);
}