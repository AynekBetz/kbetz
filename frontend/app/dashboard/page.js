"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

/* ================= INIT ================= */
useEffect(() => {
fetchGames();
}, []);

/* ================= FETCH ================= */
const fetchGames = async () => {
try {
if (!API) throw new Error("No API");


const res = await fetch(`${API}/api/data`);
const data = await res.json();

if (!data?.games || data.games.length === 0) {
  throw new Error("No games");
}

setGames(data.games);


} catch (err) {
console.log("Using fallback data");


setGames([
  {
    id:"1",
    home:"Lakers",
    away:"Warriors",
    homeOdds:-110,
    confidence:72,
    edgeScore:8
  },
  {
    id:"2",
    home:"Celtics",
    away:"Heat",
    homeOdds:-105,
    confidence:68,
    edgeScore:6
  }
]);


}
};

/* ================= AI ================= */
const aiPicks = [...games]
.sort((a,b)=>(b.edgeScore||0)-(a.edgeScore||0))
.slice(0,3);

const buildParlay = () => {
setBetSlip(aiPicks);
};

/* ================= BET ================= */
const addToSlip = (g) => {
if (!g) return;
if (betSlip.find(b => b.id === g.id)) return;
setBetSlip([...betSlip, g]);
};

const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

const payout = () => {
const odds = betSlip.reduce(
(a,b)=>a*toDecimal(b?.homeOdds ?? -110),
1
);
return (stake * odds).toFixed(2);
};

/* ================= UI ================= */
return (

<div style={styles.page}>

{/* 🔥 GRADIENT BRAND TITLE */}

<h1 style={styles.logoGradient}>KBETZ TERMINAL</h1>

{/* 🧠 ELITE AI PICKS */}

<div style={styles.aiCardElite}>
  <h3>🧠 AI PICKS</h3>

{aiPicks.map(p => ( <div key={p.id} style={styles.aiRowElite}>


  <div>
    <div style={styles.gameTitle}>
      {p.away} @ {p.home}
    </div>

    <div style={styles.metaElite}>
      <span style={styles.ev}>EV: +{p.edgeScore}%</span>
      <span>Conf: {p.confidence}%</span>
      <span style={styles.edgeTag}>MED EDGE</span>
    </div>

    <div style={styles.sharpNote}>
      • Line moving against public • Positive EV vs market
    </div>
  </div>

  <div style={styles.oddsRed}>
    {p.homeOdds} ↓
  </div>

</div>


))}

  <button style={styles.aiBtn} onClick={buildParlay}>
    🔗 Build AI Parlay
  </button>
</div>

{/* 📈 MARKETS */}

<div style={styles.card}>
  <h3>Markets</h3>

{games.map(g => ( <div key={g.id} style={styles.row}>
{g.away} @ {g.home}


  <button style={styles.odds} onClick={()=>addToSlip(g)}>
    {g.homeOdds}
  </button>
</div>


))}

</div>

{/* 💰 BET SLIP */}

<div style={styles.slip}>
<h3>Bet Slip</h3>

{betSlip.map(b => (

  <div key={b.id}>{b.home}</div>
))}

<input
value={stake}
onChange={e=>setStake(Number(e.target.value))}
/>

<div>Payout: ${payout()}</div>

<button style={styles.place}>Place Bet</button>

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
minHeight:"100vh"
},

/* 🔥 SIGNATURE TITLE */
logoGradient:{
fontSize:"28px",
fontWeight:"bold",
background:"linear-gradient(90deg,#a855f7,#22c55e)",
WebkitBackgroundClip:"text",
WebkitTextFillColor:"transparent",
textShadow:"0 0 20px rgba(168,85,247,0.5)"
},

/* 🔥 AI CARD */
aiCardElite:{
background:"linear-gradient(135deg,#7c3aed,#4c1d95)",
padding:"20px",
borderRadius:"16px",
marginBottom:"20px",
boxShadow:"0 0 40px rgba(124,58,237,0.5)"
},

aiRowElite:{
display:"flex",
justifyContent:"space-between",
padding:"15px",
marginTop:"10px",
borderRadius:"10px",
background:"rgba(0,0,0,0.2)"
},

gameTitle:{
fontWeight:"bold",
fontSize:"15px"
},

metaElite:{
fontSize:"12px",
marginTop:"5px",
display:"flex",
gap:"10px",
color:"#ddd"
},

ev:{
color:"#22c55e"
},

edgeTag:{
color:"#facc15",
fontWeight:"bold"
},

sharpNote:{
fontSize:"11px",
marginTop:"4px",
color:"#bbb"
},

oddsRed:{
color:"#ef4444",
fontWeight:"bold"
},

aiBtn:{
marginTop:"15px",
background:"#22c55e",
color:"#000",
padding:"10px",
border:"none",
cursor:"pointer",
borderRadius:"6px"
},

/* MARKETS */
card:{
background:"#111",
padding:"20px",
borderRadius:"12px"
},

row:{
display:"flex",
justifyContent:"space-between",
padding:"14px",
marginBottom:"8px",
background:"#050505",
borderRadius:"8px",
border:"1px solid rgba(255,255,255,0.05)"
},

odds:{
background:"#0f0f0f",
border:"1px solid #22c55e",
color:"#22c55e",
padding:"6px 12px",
cursor:"pointer",
borderRadius:"6px"
},

/* BET SLIP */
slip:{
position:"fixed",
right:"20px",
top:"120px",
width:"260px",
background:"#000",
padding:"15px",
border:"1px solid #22c55e",
borderRadius:"10px"
},

place:{
background:"#22c55e",
color:"#000",
padding:"10px",
border:"none",
marginTop:"10px",
cursor:"pointer",
borderRadius:"6px"
}

};
