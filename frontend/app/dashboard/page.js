"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [isPro, setIsPro] = useState(false);

/* ================= INIT ================= */
useEffect(() => {
  fetchGames();
  checkPro();
}, []);

/* ================= DATA ================= */
const fetchGames = async () => {
  try {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    if (!data || !Array.isArray(data.games)) {
      setGames([]);
      return;
    }

    setGames(data.games);

  } catch {
    setGames([]);
  }
};

/* ================= PRO ================= */
const checkPro = async () => {
  try {
    const email = localStorage.getItem("email");
    if (!email) return;

    const res = await fetch(`${API}/api/me?email=${email}`);
    const data = await res.json();

    setIsPro(data?.isPro || false);
  } catch {}
};

/* ================= STRIPE ================= */
const handleUpgrade = async () => {
  try {
    const email = localStorage.getItem("email");

    const res = await fetch(`${API}/api/checkout`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (data?.url) window.location.href = data.url;

  } catch {
    alert("Upgrade failed");
  }
};

/* ================= BET SLIP ================= */
const addToSlip = (g)=>{
  if(!g) return;
  if(betSlip.find(b=>b.id===g.id)) return;
  setBetSlip([...betSlip,g]);
};

const payout = ()=>{
  return stake.toFixed(2);
};

/* ================= UI ================= */
return (
<div style={styles.page}>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

<div style={styles.status}>
🔥 AI RECORD: 58-41 (+12.4u) | ROI: +8.7%
</div>

{/* PRO */}
{!isPro && (
<div style={styles.proBanner}>
Unlock AI picks, ROI & alerts
<button style={styles.upgradeBtn} onClick={handleUpgrade}>
Upgrade
</button>
</div>
)}

{/* GAMES */}
<div style={styles.grid}>
{Array.isArray(games) && games.map(g => (
<div key={g.id} style={styles.card}>

<div style={styles.teams}>
{g.away} vs {g.home}
</div>

<div style={styles.odds}>{g.homeOdds}</div>

<button style={styles.addBtn} onClick={()=>addToSlip(g)}>
Add
</button>

</div>
))}
</div>

{/* BET SLIP */}
<div style={styles.betPanel}>
<h3>Bet Slip</h3>

{betSlip.map(b=>(
<div key={b.id}>{b.home}</div>
))}

<input
value={stake}
onChange={e=>setStake(Number(e.target.value))}
style={styles.input}
/>

<div style={styles.payout}>
${payout()}
</div>

</div>

</div>
);
}

/* ================= CLEAN STYLES ================= */

const styles = {

page:{
background: `linear-gradient(
  to bottom,
  #000 0%,
  #0a0014 25%,
  #2b0a4a 45%,
  #6d28d9 55%,
  #2b0a4a 65%,
  #0a0014 80%,
  #000 100%
)`,
color:"white",
padding:"20px",
minHeight:"100vh"
},

logo:{
fontSize:"34px",
fontWeight:"900",
background:`linear-gradient(
  90deg,
  #7c3aed 0%,
  #9333ea 25%,
  #a855f7 45%,
  #22d3ee 70%,
  #00ffcc 100%
)`,
WebkitBackgroundClip:"text",
WebkitTextFillColor:"transparent",
color:"transparent"
},

status:{ color:"#00ffcc", marginBottom:"15px" },

grid:{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
gap:"12px"
},

card:{
background:"rgba(30,0,60,0.45)",
padding:"15px",
borderRadius:"12px",
border:"1px solid rgba(124,58,237,0.2)"
},

teams:{ color:"#ddd" },

odds:{ color:"#00ffcc", fontWeight:"bold" },

addBtn:{
background:"linear-gradient(90deg,#9333ea,#00ffcc)",
color:"#000",
padding:"8px",
border:"none",
cursor:"pointer"
},

betPanel:{
marginTop:"20px",
background:"rgba(10,0,20,0.7)",
padding:"15px",
borderRadius:"12px"
},

input:{ width:"100%", marginTop:"10px" },

payout:{ marginTop:"10px", color:"#00ffcc" },

proBanner:{
background:"linear-gradient(90deg,#6d28d9,#9333ea)",
padding:"10px",
marginBottom:"15px",
display:"flex",
justifyContent:"space-between",
borderRadius:"12px"
},

upgradeBtn:{
background:"#22c55e",
color:"#000",
padding:"8px",
border:"none",
cursor:"pointer"
}

};