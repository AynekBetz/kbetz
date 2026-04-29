"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const API = "https://kbetz-backend.onrender.com";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [ticker, setTicker] = useState("");
const [sound, setSound] = useState(null);

/* ================= INIT ================= */
useEffect(() => {
  fetchGames();
  const interval = setInterval(fetchGames, 6000);
  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const audio = new Audio("/tick.mp3");
  audio.volume = 0.2;
  setSound(audio);
}, []);

/* ================= FETCH ================= */
const fetchGames = async () => {
  const res = await fetch(`${API}/api/data`);
  const data = await res.json();

  let tickerText = "";

  const updated = (data.games || []).map(g => {
    const prev = lastOdds[g.id] ?? g.homeOdds;
    const move = g.homeOdds - prev;

    if (Math.abs(move) >= 5 && sound) {
      sound.currentTime = 0;
      sound.play().catch(()=>{});
    }

    tickerText += `${g.home} ${g.homeOdds} | `;

    return { ...g, move };
  });

  setTicker(tickerText);
  setGames(updated);

  setLastOdds(prev => {
    const copy = { ...prev };
    updated.forEach(g => copy[g.id] = g.homeOdds);
    return copy;
  });
};

/* ================= BET ================= */
const addToSlip = (g) => {
  setBetSlip([...betSlip, g]);
};

const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

const payout = () => {
  const odds = betSlip.reduce((a,b)=>a*toDecimal(b.homeOdds||-110),1);
  return (stake * odds).toFixed(2);
};

/* ================= AI ================= */
const aiPicks = [...games]
  .sort((a,b)=>(b.confidence||0)-(a.confidence||0))
  .slice(0,3);

/* ================= UI ================= */
return (
<div style={styles.page}>

{/* TICKER */}
<div style={styles.ticker}>
  <div style={styles.tickerMove}>{ticker}</div>
</div>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

{/* AI PICKS */}
<div style={styles.card}>
  <h3>🧠 AI PICKS</h3>

  {aiPicks.map(p=>(
    <div key={p.id} style={styles.row}>
      {p.away} @ {p.home}
      <span style={styles.glow}>{p.confidence}%</span>
    </div>
  ))}
</div>

{/* MARKETS */}
<div style={styles.market}>

<div style={styles.header}>
  <span>Game</span>
  <span>DK</span>
  <span>FD</span>
  <span>Best</span>
</div>

{games.map(g=>{
  const dk=g.books?.[0];
  const fd=g.books?.[1];
  const best = dk?.home > fd?.home ? dk : fd;

  return(
    <div key={g.id} style={{
      ...styles.marketRow,
      boxShadow: g.move > 0 ? "0 0 10px #00ff99" : g.move < 0 ? "0 0 10px red" : "none"
    }}>

      <div>
        <div>{g.away}</div>
        <div style={styles.sub}>{g.home}</div>
      </div>

      <button style={styles.odds} onClick={()=>addToSlip(g)}>
        {dk?.home}
      </button>

      <button style={styles.odds} onClick={()=>addToSlip(g)}>
        {fd?.home}
      </button>

      <button style={styles.best} onClick={()=>addToSlip(g)}>
        {best?.home}
      </button>

    </div>
  );
})}

</div>

{/* BET SLIP */}
<div style={styles.slip}>
<h3>Bet Slip</h3>

{betSlip.map((b,i)=>(
  <div key={i}>{b.home}</div>
))}

<input
value={stake}
onChange={e=>setStake(e.target.value)}
/>

<div>Payout: ${payout()}</div>

<button style={styles.btn}>Place Bet</button>

</div>

</div>
);
}

/* ================= STYLES ================= */
const styles = {

page:{
  background:"radial-gradient(circle at top,#0a0a0a,#000)",
  color:"white",
  padding:"20px",
  minHeight:"100vh"
},

logo:{
  color:"#00ff99",
  fontSize:"28px",
  textShadow:"0 0 15px #00ff99"
},

ticker:{
  overflow:"hidden",
  borderBottom:"1px solid #222"
},

tickerMove:{
  animation:"scroll 25s linear infinite",
  color:"#00ff99"
},

card:{
  background:"rgba(255,255,255,0.03)",
  backdropFilter:"blur(10px)",
  border:"1px solid rgba(0,255,153,0.2)",
  padding:"15px",
  borderRadius:"10px",
  marginBottom:"15px"
},

market:{
  background:"#111",
  borderRadius:"10px"
},

header:{
  display:"grid",
  gridTemplateColumns:"2fr 1fr 1fr 1fr",
  padding:"10px"
},

marketRow:{
  display:"grid",
  gridTemplateColumns:"2fr 1fr 1fr 1fr",
  padding:"10px",
  borderBottom:"1px solid #222",
  transition:"0.2s"
},

odds:{
  background:"#111",
  border:"1px solid #00ff99",
  color:"#00ff99",
  padding:"6px",
  cursor:"pointer"
},

best:{
  background:"#00ff99",
  color:"#000",
  padding:"6px"
},

row:{
  display:"flex",
  justifyContent:"space-between"
},

glow:{
  color:"#00ff99",
  textShadow:"0 0 10px #00ff99"
},

sub:{
  color:"#777"
},

slip:{
  position:"fixed",
  right:"20px",
  top:"120px",
  width:"250px",
  background:"#000",
  padding:"15px"
},

btn:{
  background:"#00ff99",
  color:"#000",
  padding:"8px",
  marginTop:"10px"
}

};