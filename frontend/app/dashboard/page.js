"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

/* ================= FETCH ================= */
useEffect(() => {
  fetchGames();
}, []);

const fetchGames = async () => {
  try {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    if (!data || !Array.isArray(data.games)) {
      setGames([]);
      return;
    }

    const safe = data.games.map((g, i) => ({
      id: g?.id || i,
      home: g?.home || "Team A",
      away: g?.away || "Team B",
      homeOdds: g?.homeOdds ?? -110,
      confidence: g?.confidence ?? 60,
      edgeScore: g?.edgeScore ?? 5
    }));

    setGames(safe);

  } catch (err) {
    console.log("fetch error", err);
    setGames([]);
  }
};

/* ================= BET ================= */
const addToSlip = (g) => {
  if (!g) return;
  setBetSlip(prev => [...prev, g]);
};

const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

const payout = () => {
  const odds = betSlip.reduce(
    (a,b)=>a*toDecimal(b?.homeOdds ?? -110),
    1
  );
  return (stake * odds).toFixed(2);
};

/* ================= AI PICKS ================= */
const aiPicks = games.slice(0,2);

/* ================= UI ================= */
return (
<div style={styles.page}>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

{/* AI CARD */}
<div style={styles.aiCard}>
  <h3>AI PICKS</h3>

  {aiPicks.map((g)=>(
    <div key={g.id} style={styles.aiRow}>
      <div>
        {g.away} @ {g.home}
        <div style={styles.meta}>
          Conf: {g.confidence}%
        </div>
      </div>

      <div style={styles.odds}>
        {g.homeOdds}
      </div>
    </div>
  ))}
</div>

{/* MARKETS */}
<div style={styles.card}>
  <h3>Markets</h3>

  {games.map((g)=>(
    <div key={g.id} style={styles.row}>
      <span>{g.away} @ {g.home}</span>

      <button
        style={styles.btn}
        onClick={() => addToSlip(g)}   // ✅ ALWAYS FUNCTION
      >
        {g.homeOdds}
      </button>
    </div>
  ))}
</div>

{/* BET SLIP */}
<div style={styles.slip}>
  <h3>Bet Slip</h3>

  {betSlip.map((b,i)=>(
    <div key={i}>{b.home}</div>
  ))}

  <input
    value={stake}
    onChange={(e)=>setStake(Number(e.target.value))}
  />

  <div>Payout: ${payout()}</div>

  <button style={styles.place}>
    Place Bet
  </button>
</div>

</div>
);
}

/* ================= STYLES ================= */

const styles = {

page:{
background:"#050505",
color:"white",
padding:"20px"
},

logo:{
color:"#00ff99",
fontSize:"26px"
},

aiCard:{
background:"#4c1d95",
padding:"15px",
borderRadius:"10px",
marginBottom:"20px"
},

aiRow:{
display:"flex",
justifyContent:"space-between",
marginBottom:"10px"
},

meta:{
fontSize:"12px",
color:"#ccc"
},

odds:{
color:"#00ff99"
},

card:{
background:"#111",
padding:"15px",
borderRadius:"10px"
},

row:{
display:"flex",
justifyContent:"space-between",
padding:"10px 0"
},

btn:{
background:"#00ff99",
color:"#000",
border:"none",
padding:"5px 10px",
cursor:"pointer"
},

slip:{
position:"fixed",
right:"20px",
top:"120px",
width:"250px",
background:"#000",
padding:"10px"
},

place:{
background:"#00ff99",
color:"#000",
padding:"8px",
border:"none"
}

};