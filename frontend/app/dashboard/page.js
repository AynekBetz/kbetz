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
    const move = (g.homeOdds || 0) - (prev || 0);

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
  .slice(0,2);

/* ================= UI ================= */
return (
<div style={styles.page}>

<style>{`
@keyframes scroll {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes flashUp {0%{background:rgba(0,255,153,0.3)}100%{background:transparent}}
@keyframes flashDown {0%{background:rgba(255,0,0,0.3)}100%{background:transparent}}
`}</style>

{/* HEADER */}
<div style={styles.header}>
  <h1 style={styles.logo}>KBETZ TERMINAL</h1>
  <div style={styles.headerRight}>
    <span style={styles.pro}>PRO</span>
    <button style={styles.headerBtn}>Logout</button>
  </div>
</div>

{/* TICKER */}
<div style={styles.ticker}>
  <div style={styles.tickerMove}>{ticker}</div>
</div>

{/* AI HERO */}
<div style={styles.aiHero}>
  <h2>🧠 AI PICKS</h2>

  {aiPicks.map((g,i)=>(
    <div key={i} style={styles.aiRow}>
      <div>
        <div>{g.away} @ {g.home}</div>
        <div style={styles.meta}>
          EV: +{(g.ev||5).toFixed(2)}% | Conf: {g.confidence||60}%
        </div>
      </div>

      <div style={styles.oddsRed}>
        {g.homeOdds || -110} ↓
      </div>
    </div>
  ))}
</div>

{/* MARKETS */}
<div style={styles.marketBox}>
  <h3>Markets</h3>

  {games.map(g=>{

    const dk=g.books?.[0];
    const fd=g.books?.[1];
    const best = dk?.home > fd?.home ? dk : fd;

    const flash =
      g.move > 0 ? { animation:"flashUp 0.5s" } :
      g.move < 0 ? { animation:"flashDown 0.5s" } : {};

    return(
      <div key={g.id} style={{...styles.marketRow,...flash}}>

        <span>{g.away} @ {g.home}</span>

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
<div style={{marginTop:"20px"}}>
  {!isPro && (
    <button onClick={upgrade} style={styles.proBtn}>
      Upgrade to PRO
    </button>
  )}
</div>

{/* BET SLIP */}
<div style={styles.slip}>
  <h3>Bet Slip</h3>

  {betSlip.map((b,i)=>(
    <div key={i}>{b.home}</div>
  ))}

  <input value={stake} onChange={e=>setStake(e.target.value)} />

  <div>Payout: ${payout()}</div>

  <button style={styles.betBtn}>Place Bet</button>
</div>

</div>
);
}

/* ================= STYLES ================= */
const styles = {

page:{background:"#000",color:"white",padding:"20px"},

header:{display:"flex",justifyContent:"space-between",marginBottom:"10px"},
logo:{color:"#00ff99",textShadow:"0 0 10px #00ff99"},
headerRight:{display:"flex",gap:"10px"},
headerBtn:{background:"#111",color:"white",border:"1px solid #333",padding:"5px"},
pro:{color:"#00ff99"},

ticker:{overflow:"hidden"},
tickerMove:{animation:"scroll 20s linear infinite",color:"#00ff99"},

aiHero:{
  background:"linear-gradient(135deg,#6b21a8,#3b0764)",
  padding:"20px",
  borderRadius:"12px",
  marginBottom:"20px"
},

aiRow:{
  display:"flex",
  justifyContent:"space-between",
  marginBottom:"10px"
},

meta:{fontSize:"12px",color:"#ccc"},
oddsRed:{color:"red"},

marketBox:{background:"#0a0a0a",padding:"15px",borderRadius:"10px"},
marketRow:{
  display:"flex",
  justifyContent:"space-between",
  padding:"10px",
  marginBottom:"5px",
  background:"#050505",
  borderRadius:"6px"
},

odds:{color:"#00ff99",background:"transparent",border:"none"},
best:{color:"#000",background:"#00ff99",padding:"5px"},

slip:{
  position:"fixed",
  right:"20px",
  top:"120px",
  width:"250px",
  background:"#000",
  border:"1px solid #00ff99",
  padding:"10px"
},

betBtn:{background:"#00ff99",color:"#000",padding:"8px"},

proBtn:{
  background:"#00ff99",
  color:"#000",
  padding:"10px",
  marginTop:"10px"
}

};