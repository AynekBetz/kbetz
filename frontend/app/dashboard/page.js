"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

/* 🔥 NEW: toggle state for WHY panels */
const [openWhy, setOpenWhy] = useState({});

useEffect(() => {
fetchGames();
}, []);

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
edgeScore:8,
move:2,
steam:true,
steamStrength:"medium",
ev:6.5
},
{
id:"2",
home:"Celtics",
away:"Heat",
homeOdds:-105,
confidence:68,
edgeScore:6,
move:-3,
steam:true,
steamStrength:"strong",
ev:4.2
}
]);
}
};

const aiPicks = [...games]
.sort((a,b)=>(b.edgeScore||0)-(a.edgeScore||0))
.slice(0,3);

const buildParlay = () => {
setBetSlip(aiPicks);
};

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

/* 🔥 NEW: helper to toggle WHY panel */
const toggleWhy = (id) => {
setOpenWhy(prev => ({ ...prev, [id]: !prev[id] }));
};

return (

<div style={styles.page}>

{/* 🔥 SIGNATURE HEADER */}

  <div style={styles.topBar}>
    <h1 style={styles.logo}>KBETZ TERMINAL</h1>

```
<div style={styles.actions}>
  <span style={styles.pro}>PRO</span>
  <button style={styles.smallBtn}>Logout</button>
  <button style={styles.smallBtnOutline}>Sign Up</button>
</div>
```

  </div>

{/* 🔥 AI RECORD (TRUST) */}

  <div style={styles.record}>
    🔥 AI RECORD: 58-41 (+12.4u) | ROI: +8.7%
  </div>

{/* AI PICKS */}

  <div style={styles.aiCard}>
    <h3 style={styles.aiTitle}>🧠 AI PICKS</h3>

```
{aiPicks.map(p => (
  <div key={p.id} style={styles.aiRow}>

    <div style={{flex:1}}>
      <div style={styles.gameTitle}>
        {p.away} @ {p.home}
      </div>

      <div style={styles.meta}>
        <span style={styles.ev}>EV: +{p.edgeScore}%</span>
        <span>Conf: {p.confidence}%</span>
        <span style={styles.edge}>MED EDGE</span>

        {/* 🔥 STEAM BADGE */}
        {p.steam && (
          <span style={styles.steam}>
            {p.steamStrength === "strong" ? "🔥 STRONG STEAM" : "⚡ STEAM"}
          </span>
        )}
      </div>

      {/* 🔥 WHY BUTTON */}
      <div style={styles.whyBtn} onClick={()=>toggleWhy(p.id)}>
        {openWhy[p.id] ? "Hide Details ▲" : "Why this pick? ▼"}
      </div>

      {/* 🔥 WHY PANEL */}
      {openWhy[p.id] && (
        <div style={styles.reasonBox}>
          <div>📊 Public: {Math.floor(Math.random()*30+55)}%</div>
          <div>📉 Line Move: {p.move > 0 ? "+" : ""}{p.move}</div>
          <div>💰 Edge: +{p.edgeScore}% vs market</div>
          <div>⚡ Steam Strength: {p.steamStrength || "none"}</div>
        </div>
      )}

    </div>

    <div style={styles.odds}>
      {p.homeOdds} ↓
    </div>

  </div>
))}

<button style={styles.btn} onClick={buildParlay}>
  🔗 Build AI Parlay
</button>
```

  </div>

{/* MARKETS */}

  <div style={styles.marketCard}>
    <h3 style={styles.marketTitle}>Markets</h3>

```
{games.map(g => (
  <div key={g.id} style={styles.marketRow}>
    {g.away} @ {g.home}

    <button style={styles.oddsBtn} onClick={()=>addToSlip(g)}>
      {g.homeOdds}
    </button>
  </div>
))}
```

  </div>

{/* BET SLIP */}

  <div style={styles.slip}>
    <h3>Bet Slip</h3>

```
{betSlip.map(b => (
  <div key={b.id}>{b.home}</div>
))}

<input
  value={stake}
  onChange={e=>setStake(Number(e.target.value))}
  style={styles.input}
/>

<div>Payout: ${payout()}</div>

<button style={styles.place}>Place Bet</button>
```

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

topBar:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"20px"
},

logo:{
fontSize:"28px",
fontWeight:"900",
background:"linear-gradient(90deg,#a855f7,#00ff99)",
WebkitBackgroundClip:"text",
WebkitTextFillColor:"transparent",
textShadow:"0 0 25px rgba(168,85,247,0.35)"
},

actions:{
display:"flex",
gap:"10px",
alignItems:"center"
},

pro:{
color:"#00ff99",
fontWeight:"bold"
},

smallBtn:{
background:"#1a1a1a",
color:"#fff",
border:"none",
padding:"6px 12px",
borderRadius:"6px"
},

smallBtnOutline:{
background:"transparent",
border:"1px solid #00ff99",
color:"#00ff99",
padding:"6px 12px",
borderRadius:"6px"
},

/* 🔥 TRUST RECORD */
record:{
marginBottom:"15px",
color:"#22c55e",
fontWeight:"bold"
},

/* AI CARD */
aiCard:{
background:"linear-gradient(135deg,#7c3aed,#4c1d95)",
padding:"20px",
borderRadius:"18px",
boxShadow:"0 0 60px rgba(124,58,237,0.6)",
marginBottom:"25px"
},

aiTitle:{
marginBottom:"10px"
},

aiRow:{
display:"flex",
justifyContent:"space-between",
padding:"18px",
marginTop:"12px",
borderRadius:"12px",
background:"rgba(0,0,0,0.25)"
},

gameTitle:{
fontWeight:"bold",
fontSize:"16px"
},

meta:{
fontSize:"12px",
display:"flex",
gap:"10px",
marginTop:"6px",
flexWrap:"wrap"
},

ev:{ color:"#22c55e" },

edge:{
color:"#facc15",
fontWeight:"bold"
},

/* 🔥 STEAM STYLE */
steam:{
color:"#f97316",
fontWeight:"bold"
},

/* 🔥 WHY BUTTON */
whyBtn:{
marginTop:"6px",
fontSize:"12px",
color:"#00ff99",
cursor:"pointer"
},

/* 🔥 WHY PANEL */
reasonBox:{
marginTop:"8px",
fontSize:"11px",
color:"#aaa",
lineHeight:"1.5"
},

odds:{
color:"#ff4d4d",
fontWeight:"bold"
},

btn:{
marginTop:"15px",
background:"#22c55e",
color:"#000",
padding:"10px",
border:"none",
borderRadius:"6px",
cursor:"pointer"
},

/* MARKETS */
marketCard:{
background:"linear-gradient(180deg,#0b0b0b,#050505)",
padding:"20px",
borderRadius:"16px",
boxShadow:"0 0 30px rgba(0,0,0,0.6)"
},

marketTitle:{
marginBottom:"10px"
},

marketRow:{
display:"flex",
justifyContent:"space-between",
padding:"14px",
marginTop:"10px",
background:"#050505",
borderRadius:"10px"
},

oddsBtn:{
background:"#0f0f0f",
border:"1px solid #22c55e",
color:"#22c55e",
padding:"6px 14px",
borderRadius:"8px"
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

input:{
width:"100%",
marginTop:"10px",
marginBottom:"10px",
padding:"6px"
},

place:{
background:"#22c55e",
color:"#000",
padding:"10px",
border:"none",
marginTop:"10px",
borderRadius:"6px",
cursor:"pointer"
}

};
