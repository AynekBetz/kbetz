"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [activeTab, setActiveTab] = useState("NBA");
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [ticker, setTicker] = useState("");
const [tickSound, setTickSound] = useState(null);

/* ================= INIT ================= */
useEffect(() => {
  fetchGames();
  const interval = setInterval(fetchGames, 6000);
  return () => clearInterval(interval);
}, [activeTab]);

useEffect(() => {
  const tick = new Audio("/tick.mp3");
  tick.volume = 0.3;
  setTickSound(tick);
}, []);

/* ================= FETCH ================= */
const fetchGames = async () => {

  const sportMap = {
    NBA: "basketball_nba",
    NFL: "americanfootball_nfl",
    PROPS: "basketball_nba"
  };

  const res = await fetch(`${API}/api/data?sport=${sportMap[activeTab]}`);
  const data = await res.json();

  let tickerText = "";

  const updated = (data.games || []).map((g) => {
    const prev = lastOdds[g.id] ?? g.homeOdds;
    const move = (g.homeOdds ?? 0) - prev;

    if (Math.abs(move) >= 5 && tickSound) {
      tickSound.currentTime = 0;
      tickSound.play().catch(() => {});
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

/* ================= UTILS ================= */
const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

const calcArb = (a,b,stake=100)=>{
  const d1 = toDecimal(a);
  const d2 = toDecimal(b);

  const inv = (1/d1)+(1/d2);
  if(inv>=1) return null;

  const s1 = stake*(1/d1)/inv;
  const s2 = stake*(1/d2)/inv;

  const payout = s1*d1;
  const profit = payout - stake;

  return {
    s1:s1.toFixed(2),
    s2:s2.toFixed(2),
    profit:profit.toFixed(2),
    roi:((profit/stake)*100).toFixed(2)
  };
};

/* ================= AI ================= */
const aiPicks = [...games]
  .sort((a,b)=>(b.edgeScore||0)-(a.edgeScore||0))
  .slice(0,3);

const bestBet = aiPicks[0];

const buildParlay = ()=>setBetSlip(aiPicks);

/* ================= BET ================= */
const addToSlip = (g, odds, book)=>{
  setBetSlip([...betSlip, { ...g, odds, book }]);
};

const payout = ()=>{
  const odds = betSlip.reduce((a,b)=>a*toDecimal(b.odds||-110),1);
  return (stake*odds).toFixed(2);
};

/* ================= UI ================= */
return (
<div style={styles.page}>

{/* 📡 TICKER (KEPT) */}
<div style={styles.ticker}>
  <div style={styles.tickerMove}>{ticker}</div>
</div>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

{/* 🧭 TABS (ADDED) */}
<div style={styles.tabs}>
  {["NBA","NFL","PROPS"].map(t=>(
    <button
      key={t}
      style={{
        ...styles.tab,
        background:activeTab===t?"#00ff99":"#111",
        color:activeTab===t?"#000":"#fff"
      }}
      onClick={()=>setActiveTab(t)}
    >
      {t}
    </button>
  ))}
</div>

{/* 🧠 AI CARD (KEPT + ENHANCED) */}
<div style={styles.aiCard}>
  <h3>🧠 AI PICKS</h3>

  {aiPicks.map(p=>(
    <div key={p.id} style={styles.aiRow}>
      {p.away} @ {p.home}
      <span style={styles.green}>{p.homeOdds}</span>
    </div>
  ))}

  <button style={styles.btn} onClick={buildParlay}>
    🔗 Build AI Parlay
  </button>
</div>

{/* 💰 ARBITRAGE (ADDED) */}
<div style={styles.card}>
  <h3>💰 Arbitrage</h3>

  {games.map(g=>{
    const dk=g.books?.[0];
    const fd=g.books?.[1];
    const arb=calcArb(dk?.home, fd?.away);

    if(!arb) return null;

    return(
      <div key={g.id} style={styles.row}>
        {g.home}
        <div>DK ${arb.s1} / FD ${arb.s2}</div>
        <div style={styles.green}>+${arb.profit}</div>
      </div>
    );
  })}
</div>

{/* 📈 MARKETS (UPGRADED NOT REPLACED) */}
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
    <div key={g.id} style={styles.marketRow}>

      <div>
        <div>{g.away}</div>
        <div style={styles.sub}>{g.home}</div>
      </div>

      <button style={styles.odds} onClick={()=>addToSlip(g,dk?.home,"DK")}>
        {dk?.home}
      </button>

      <button style={styles.odds} onClick={()=>addToSlip(g,fd?.home,"FD")}>
        {fd?.home}
      </button>

      <button style={styles.best} onClick={()=>addToSlip(g,best?.home,"BEST")}>
        {best?.home}
      </button>

    </div>
  );
})}

</div>

{/* 💰 BET SLIP (KEPT) */}
<div style={styles.slip}>
<h3>Bet Slip</h3>

{betSlip.map((b,i)=>(
  <div key={i}>{b.home} ({b.book})</div>
))}

<input value={stake} onChange={e=>setStake(e.target.value)} />

<div>Payout: ${payout()}</div>

<button style={styles.btn}>Place Bet</button>

</div>

</div>
);
}

/* ================= STYLES ================= */
const styles={
page:{background:"#0b0b0b",color:"white",padding:"20px"},
logo:{fontSize:"28px"},
tabs:{display:"flex",gap:"10px",marginBottom:"10px"},
tab:{padding:"8px 12px",border:"none"},
ticker:{overflow:"hidden",whiteSpace:"nowrap"},
tickerMove:{display:"inline-block"},
aiCard:{background:"#111",padding:"15px",marginBottom:"10px"},
aiRow:{display:"flex",justifyContent:"space-between"},
card:{background:"#111",padding:"15px",marginBottom:"10px"},
row:{display:"flex",justifyContent:"space-between"},
market:{background:"#111"},
header:{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr"},
marketRow:{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr"},
odds:{background:"#1a1a1a",color:"#00ff99"},
best:{background:"#1a1a1a",border:"1px solid #00ff99"},
slip:{position:"fixed",right:"20px",top:"120px",width:"260px",background:"#000",padding:"10px"},
btn:{background:"#00ff99",color:"#000"},
green:{color:"#00ff99"},
sub:{color:"#aaa"}
};