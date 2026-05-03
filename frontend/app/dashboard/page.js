"use client";

import { useEffect, useState } from "react";

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
const handleUpgrade = async () => {
  try {
    const email = localStorage.getItem("email");

    const res = await fetch(`${API}/api/checkout`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (data.url) window.location.href = data.url;

  } catch (err) {
    console.log(err);
    alert("Server error");
  }
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
<div style={styles.page}>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

<div style={styles.status}>
🔥 AI RECORD: 58-41 (+12.4u) | ROI: +8.7%
</div>

{/* ALERTS */}
<div style={styles.alertBar}>
{alerts.map(a=>(
<div key={a.id} style={styles.alert}>{a.text}</div>
))}
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
{games.map(g => (
<div key={g.id} style={{
...styles.card,
...(flashMap[g.id]==="up" && styles.flashUp),
...(flashMap[g.id]==="down" && styles.flashDown)
}}>

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

/* ================= KBETZ FULL BLEND SYSTEM ================= */

const styles = {

page:{
background: `
linear-gradient(
  to bottom,
  #000 0%,
  #0a0014 25%,
  #2b0a4a 45%,
  #6d28d9 55%,
  #2b0a4a 65%,
  #0a0014 80%,
  #000 100%
)
`,
color:"white",
padding:"20px",
minHeight:"100vh"
},

logo:{
fontSize:"32px",
fontWeight:"900",
background:`linear-gradient(
  90deg,
  #6d28d9 0%,
  #9333ea 35%,
  #a855f7 55%,
  #22d3ee 80%,
  #00ffcc 100%
)`,
WebkitBackgroundClip:"text",
WebkitTextFillColor:"transparent"
},

status:{
color:"#00ffcc",
marginBottom:"15px"
},

alertBar:{
display:"flex",
gap:"10px",
marginBottom:"15px"
},

alert:{
background:"rgba(255,255,255,0.05)",
padding:"6px 10px",
borderRadius:"6px"
},

grid:{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
gap:"12px"
},

card:{
background:"rgba(30,0,60,0.45)",
backdropFilter:"blur(10px)",
padding:"15px",
borderRadius:"12px",
border:"1px solid rgba(124,58,237,0.2)",
boxShadow:"0 0 20px rgba(124,58,237,0.15)"
},

teams:{ color:"#ddd" },

odds:{
color:"#00ffcc",
fontWeight:"bold"
},

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
border:"1px solid rgba(0,255,200,0.2)",
padding:"15px",
borderRadius:"12px"
},

input:{
width:"100%",
marginTop:"10px"
},

payout:{
marginTop:"10px",
color:"#00ffcc"
},

proBanner:{
background:"linear-gradient(90deg,#6d28d9,#9333ea)",
padding:"10px",
marginBottom:"15px",
display:"flex",
justifyContent:"space-between",
borderRadius:"12px",
boxShadow:"0 0 40px rgba(124,58,237,0.4)"
},

upgradeBtn:{
background:"#22c55e",
color:"#000",
padding:"8px",
border:"none",
cursor:"pointer"
},

flashUp:{ boxShadow:"0 0 15px rgba(0,255,200,0.4)" },
flashDown:{ boxShadow:"0 0 15px rgba(255,0,0,0.4)" }

};