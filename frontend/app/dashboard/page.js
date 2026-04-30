"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

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

return ( <div style={styles.page}>


  {/* 🔥 SIGNATURE TITLE */}
  <h1 style={styles.logo}>
    <span style={styles.kbetz}>KBETZ</span>{" "}
    <span style={styles.terminal}>TERMINAL</span>
  </h1>

  {/* AI PICKS */}
  <div style={styles.aiCard}>
    <h3>🧠 AI PICKS</h3>

    {aiPicks.map(p => (
      <div key={p.id} style={styles.aiRow}>

        <div>
          <div style={styles.gameTitle}>
            {p.away} @ {p.home}
          </div>

          <div style={styles.meta}>
            <span style={styles.ev}>EV: +{p.edgeScore}%</span>
            <span>Conf: {p.confidence}%</span>
            <span style={styles.edge}>MED EDGE</span>
          </div>

          <div style={styles.note}>
            • Line moving against public • Positive EV vs market
          </div>
        </div>

        <div style={styles.odds}>
          {p.homeOdds} ↓
        </div>

      </div>
    ))}

    <button style={styles.btn} onClick={buildParlay}>
      🔗 Build AI Parlay
    </button>
  </div>

  {/* MARKETS */}
  <div style={styles.card}>
    <h3>Markets</h3>

    {games.map(g => (
      <div key={g.id} style={styles.row}>
        {g.away} @ {g.home}

        <button style={styles.oddsBtn} onClick={()=>addToSlip(g)}>
          {g.homeOdds}
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
      onChange={e=>setStake(Number(e.target.value))}
      style={styles.input}
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

logo:{
fontSize:"28px",
fontWeight:"900",
letterSpacing:"1px"
},

/* 🔥 YOUR SIGNATURE COLORS */
kbetz:{
color:"#a855f7",
textShadow:"0 0 10px rgba(168,85,247,0.7)"
},

terminal:{
color:"#00ff99",
textShadow:"0 0 10px rgba(0,255,153,0.7)"
},

aiCard:{
background:"linear-gradient(135deg,#7c3aed,#4c1d95)",
padding:"20px",
borderRadius:"16px",
marginBottom:"20px",
boxShadow:"0 0 40px rgba(124,58,237,0.5)"
},

aiRow:{
display:"flex",
justifyContent:"space-between",
padding:"15px",
marginTop:"10px",
borderRadius:"10px",
background:"rgba(0,0,0,0.2)"
},

gameTitle:{
fontWeight:"bold"
},

meta:{
fontSize:"12px",
display:"flex",
gap:"10px",
marginTop:"5px"
},

ev:{ color:"#22c55e" },

edge:{
color:"#facc15",
fontWeight:"bold"
},

note:{
fontSize:"11px",
color:"#bbb",
marginTop:"4px"
},

odds:{
color:"#ef4444",
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
borderRadius:"8px"
},

oddsBtn:{
background:"#0f0f0f",
border:"1px solid #22c55e",
color:"#22c55e",
padding:"6px 12px",
borderRadius:"6px",
cursor:"pointer"
},

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
