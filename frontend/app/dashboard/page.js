"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [tickSound, setTickSound] = useState(null);

/* ================= INIT ================= */
useEffect(() => {
  fetchGames();
}, []);

/* SAFE AUDIO (no crash) */
useEffect(() => {
  if (typeof window !== "undefined") {
    try {
      const tick = new Audio("/tick.mp3");
      tick.volume = 0.25;
      setTickSound(tick);
    } catch (e) {
      console.log("Audio failed (safe ignore)");
    }
  }
}, []);

/* ================= FETCH (CRASH PROOF) ================= */
const fetchGames = async () => {
  try {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    if (!data || !Array.isArray(data.games)) {
      console.log("No valid games");
      setGames([]);
      return;
    }

    const safeGames = data.games.map((g, i) => ({
      id: g?.id || i,
      home: g?.home || "Unknown",
      away: g?.away || "Unknown",
      homeOdds: g?.homeOdds ?? -110,
      books: Array.isArray(g?.books) ? g.books : [],
      edgeScore: g?.edgeScore || 0,
      confidence: g?.confidence || 60
    }));

    setGames(safeGames);

  } catch (err) {
    console.log("FETCH FAILED", err);
    setGames([]);
  }
};

/* ================= AI ================= */
const aiPicks = [...games]
  .sort((a, b) => (b.edgeScore || 0) - (a.edgeScore || 0))
  .slice(0, 3);

const buildParlay = () => {
  setBetSlip(aiPicks);
};

/* ================= BET ================= */
const addToSlip = (g) => {
  if (betSlip.find(b => b.id === g.id)) return;
  setBetSlip([...betSlip, g]);

  if (tickSound) {
    try {
      tickSound.currentTime = 0;
      tickSound.play().catch(()=>{});
    } catch {}
  }
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

{/* HEADER */}
<div style={styles.header}>
  <h1 style={styles.logo}>KBETZ TERMINAL</h1>
  <div style={styles.topRight}>
    <span style={styles.pro}>PRO</span>
  </div>
</div>

{/* AI PICKS */}
<div style={styles.aiCard}>
  <h3>🧠 AI PICKS</h3>

  {aiPicks.map(p => (
    <div key={p.id} style={styles.aiRow}>
      <div>
        {p.away} @ {p.home}
        <div style={styles.meta}>
          EV: +{(p.edgeScore || 5).toFixed(1)}% | Conf: {p.confidence}%
        </div>
      </div>

      <div style={styles.oddsGlow}>
        {p.homeOdds}
      </div>
    </div>
  ))}

  <button style={styles.aiBtn} onClick={buildParlay}>
    🔗 Build AI Parlay
  </button>
</div>

{/* MARKETS */}
<div style={styles.card}>
  <h3>Markets</h3>

  {games.map(g => (
    <div key={g.id} style={styles.row}>
      {g.away} @ {g.home}

      <button
        style={styles.odds}
        onClick={()=>addToSlip(g)}
      >
        {g?.homeOdds ?? "-"}
      </button>
    </div>
  ))}
</div>

{/* BET SLIP */}
<div style={styles.slip}>
<h3>Bet Slip</h3>

{betSlip.map(b => (
  <div key={b.id}>{b.home}</div>
))}

<input
  value={stake}
  onChange={e=>setStake(e.target.value)}
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

header:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"20px"
},

logo:{
color:"#00ff99",
fontSize:"28px",
textShadow:"0 0 12px #00ff99"
},

topRight:{
display:"flex",
gap:"10px"
},

pro:{
color:"#00ff99"
},

/* AI CARD (SIGNATURE PURPLE) */
aiCard:{
background:"linear-gradient(135deg,#6d28d9,#4c1d95)",
padding:"20px",
borderRadius:"14px",
marginBottom:"20px",
boxShadow:"0 0 30px rgba(109,40,217,0.4)"
},

aiRow:{
display:"flex",
justifyContent:"space-between",
padding:"12px 0",
borderBottom:"1px solid rgba(255,255,255,0.1)"
},

meta:{
fontSize:"12px",
color:"#ddd"
},

oddsGlow:{
color:"#00ff99",
fontWeight:"bold",
textShadow:"0 0 10px #00ff99"
},

aiBtn:{
marginTop:"15px",
background:"#00ff99",
color:"#000",
padding:"10px",
border:"none",
cursor:"pointer",
borderRadius:"6px"
},

card:{
background:"#111",
padding:"20px",
borderRadius:"12px"
},

row:{
display:"flex",
justifyContent:"space-between",
padding:"12px 0",
borderBottom:"1px solid #222"
},

odds:{
background:"#0f0f0f",
border:"1px solid #00ff99",
color:"#00ff99",
padding:"6px 12px",
cursor:"pointer",
borderRadius:"6px"
},

slip:{
position:"fixed",
right:"20px",
top:"120px",
width:"260px",
background:"#000",
padding:"15px",
border:"1px solid #00ff99",
borderRadius:"10px"
},

place:{
background:"#00ff99",
color:"#000",
padding:"10px",
border:"none",
marginTop:"10px",
cursor:"pointer",
borderRadius:"6px"
}

};