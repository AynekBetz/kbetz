"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz-backend.onrender.com";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [ticker, setTicker] = useState("");
const [sound, setSound] = useState(null);
const [isPro, setIsPro] = useState(false);

/* ================= INIT ================= */
useEffect(() => {
  fetchGames();
  checkPro();

  const interval = setInterval(fetchGames, 5000);
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

/* ================= PRO ================= */
const checkPro = async () => {
  try {
    const res = await fetch(`${API}/api/me?email=test@test.com`);
    const data = await res.json();
    setIsPro(data.isPro);
  } catch {}
};

const upgrade = async () => {
  const res = await fetch(`${API}/api/checkout`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ email:"test@test.com" })
  });

  const data = await res.json();
  window.location.href = data.url;
};

/* ================= BET ================= */
const addToSlip = (g) => setBetSlip([...betSlip, g]);

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

{/* GLOBAL STYLES */}
<style>{`

@keyframes scroll {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}

@keyframes pulse {
  0% { box-shadow: 0 0 5px #00ff99; }
  50% { box-shadow: 0 0 20px #00ff99; }
  100% { box-shadow: 0 0 5px #00ff99; }
}

@keyframes flashUp {
  0% { background: rgba(0,255,153,0.3); }
  100% { background: transparent; }
}

@keyframes flashDown {
  0% { background: rgba(255,0,0,0.3); }
  100% { background: transparent; }
}

/* GLASS */
.glass {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0,255,153,0.15);
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}

/* 3D */
.card3d {
  transform-style: preserve-3d;
  transition: 0.2s;
}

.card3d:hover {
  transform: translateY(-4px) scale(1.01);
}

/* SAFE BLUR */
.blurOverlay {
  position:absolute;
  inset:0;
  backdrop-filter:blur(6px);
  background:rgba(0,0,0,0.4);
  pointer-events:none;
}

`}</style>

{/* TICKER */}
<div style={styles.ticker}>
  <div style={styles.tickerMove}>{ticker}</div>
</div>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

{/* AI PICKS */}
<div style={styles.card} className="glass card3d">
  <h3>🧠 AI PICKS</h3>

  {aiPicks.map(p=>(
    <div key={p.id} style={styles.row}>
      {p.away} @ {p.home}
      <span style={styles.glow}>{p.confidence}%</span>
    </div>
  ))}
</div>

{/* MARKETS */}
<div style={styles.market} className="glass">

{games.map(g=>{
  const dk=g.books?.[0];
  const fd=g.books?.[1];
  const best = dk?.home > fd?.home ? dk : fd;

  const flash =
    g.move > 0 ? { animation:"flashUp 0.5s" } :
    g.move < 0 ? { animation:"flashDown 0.5s" } :
    {};

  return(
    <div key={g.id} style={{...styles.marketRow,...flash}} className="card3d">

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

{/* PRO SECTION */}
<div style={{position:"relative",marginTop:"20px"}}>

{!isPro && <div className="blurOverlay" />}

<div style={{position:"relative",zIndex:2}}>

<h3>🔥 PRO FEATURES</h3>
<div>Advanced AI + Steam + Arbitrage</div>

<button onClick={upgrade} style={styles.btn}>
  Upgrade to PRO
</button>

</div>

</div>

{/* BET SLIP */}
<div style={styles.slip} className="glass card3d">
<h3>Bet Slip</h3>

{betSlip.map((b,i)=>(
  <div key={i}>{b.home}</div>
))}

<input value={stake} onChange={e=>setStake(e.target.value)} />

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
  textShadow:"0 0 15px #00ff99"
},

ticker:{overflow:"hidden"},
tickerMove:{
  animation:"scroll 25s linear infinite",
  color:"#00ff99"
},

card:{padding:"15px",marginBottom:"15px",borderRadius:"10px"},

market:{borderRadius:"10px"},

marketRow:{
  display:"grid",
  gridTemplateColumns:"2fr 1fr 1fr 1fr",
  padding:"10px",
  borderBottom:"1px solid #222"
},

odds:{
  border:"1px solid #00ff99",
  color:"#00ff99",
  padding:"6px",
  cursor:"pointer"
},

best:{
  background:"#00ff99",
  color:"#000",
  padding:"6px",
  animation:"pulse 2s infinite"
},

row:{display:"flex",justifyContent:"space-between"},

glow:{color:"#00ff99",textShadow:"0 0 10px #00ff99"},

sub:{color:"#777"},

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
  marginTop:"10px",
  cursor:"pointer"
}

};