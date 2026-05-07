"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [loading, setLoading] = useState(true);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [isPro, setIsPro] = useState(false);
const [alerts, setAlerts] = useState([]);

// ✅ ADDED ONLY
const [alertHistory, setAlertHistory] = useState([]);

const prevOdds = useRef({});
const audioRef = useRef(null);

/* ================= INIT ================= */
useEffect(() => {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  if (!token) return (window.location.href = "/");

  checkPro(email);
  fetchGames();

  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "true") {
    setTimeout(() => {
      checkPro(email);
      window.history.replaceState({}, document.title, "/dashboard");
    }, 1500);
  }

  const t = setInterval(fetchGames, 8000);
  return () => clearInterval(t);
}, []);

/* ================= PRO CHECK ================= */
const checkPro = async (email) => {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${API}/api/me?email=${email}`);
    const data = await res.json();
    setIsPro(data?.isPro || false);
  } catch {
    setIsPro(false);
  }
};

/* ================= ALERT SYSTEM ================= */
const pushAlert = (text) => {
  const id = Date.now();

  const alertObj = { id, text };

  // existing live alerts
  setAlerts(prev => [...prev, alertObj]);

  // ✅ ADDED: store history (max 50)
  setAlertHistory(prev => [alertObj, ...prev].slice(0, 50));

  setTimeout(() => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, 4000);
};

/* ================= FETCH ================= */
const fetchGames = async () => {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    const updated = (data.games || []).map(g => {
      const prev = prevOdds.current[g.id];

      let movement = "";
      let steam = false;

      if (prev !== undefined) {
        const diff = g.homeOdds - prev;

        if (diff > 0) movement = "up";
        if (diff < 0) movement = "down";

        if (Math.abs(diff) >= 5) {
          steam = true;

          // existing alert
          pushAlert(`🔥 STEAM: ${g.away} @ ${g.home} → ${g.homeOdds}`);
        }

        if ((movement || steam) && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(()=>{});
        }
      }

      prevOdds.current[g.id] = g.homeOdds;

      return {
        ...g,
        movement,
        steam,
        ev: g.ev || (Math.random()*5+3).toFixed(2),
        confidence: g.confidence || Math.floor(Math.random()*20+70)
      };
    });

    setGames(updated);

  } catch {
    setGames([
      { id:1, away:"Warriors", home:"Lakers", homeOdds:-110, ev:5.2, confidence:80 },
      { id:2, away:"Heat", home:"Celtics", homeOdds:-105, ev:4.7, confidence:75 }
    ]);
  } finally {
    setLoading(false);
  }
};

/* ================= WIN PROB ================= */
const getWinProbability = (odds, confidence) => {
  let base = odds > 0
    ? 100 / (odds + 100)
    : Math.abs(odds) / (Math.abs(odds) + 100);

  base = base * (confidence / 100);
  return (base * 100).toFixed(1);
};

const parlayProbability = () => {
  if (!betSlip.length) return 0;

  let prob = 1;
  betSlip.forEach(b => {
    const p = getWinProbability(b.homeOdds, b.confidence) / 100;
    prob *= p;
  });

  return (prob * 100).toFixed(2);
};

/* ================= AI BUILDER ================= */
const buildAIParlayAdvanced = (type = "balanced") => {
  if (!isPro) return;

  const scored = games.map(g => ({
    ...g,
    score: Number(g.ev) + (g.confidence / 20) + (g.steam ? 1.5 : 0)
  }));

  const ranked = scored.sort((a,b) => b.score - a.score);

  let picks = [];

  if (type === "safe") picks = ranked.filter(g => g.confidence >= 75).slice(0,2);
  if (type === "balanced") picks = ranked.slice(0,3);
  if (type === "aggressive") picks = ranked.filter(g => g.ev >= 4 || g.steam).slice(0,4);

  setBetSlip(picks);
};

/* ================= UPGRADE ================= */
const handleUpgrade = async () => {
  const email = localStorage.getItem("email");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API}/api/checkout`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (data.url) window.location.href = data.url;
};

/* ================= BET ================= */
const addToSlip = (g) => {
  if (betSlip.find(b => b.id === g.id)) return;
  setBetSlip([...betSlip, g]);
};

const removeBet = (id) => {
  setBetSlip(betSlip.filter(b => b.id !== id));
};

const payout = () => {
  let total = 1;
  betSlip.forEach(b => {
    const o = b.homeOdds;
    const d = o > 0 ? (o/100)+1 : (100/Math.abs(o))+1;
    total *= d;
  });
  return (stake * total).toFixed(2);
};

/* ================= UI ================= */
if (loading) return <div style={styles.loading}>Loading...</div>;

return (
<div style={styles.page}>

<audio ref={audioRef} src="/alert.mp3" />

{/* ALERTS */}
<div style={styles.alertContainer}>
  {alerts.map(a => (
    <div key={a.id} style={styles.alert}>
      {a.text}
    </div>
  ))}
</div>

{/* HEADER */}
<div style={styles.header}>
  <h1 style={styles.logo}>KBETZ TERMINAL</h1>

  <div style={styles.headerRight}>
    <span style={styles.live}>● LIVE FEED</span>
    <span style={isPro ? styles.proBadge : styles.freeBadge}>
      {isPro ? "PRO" : "FREE"}
    </span>
  </div>
</div>

{/* TICKER */}
<div style={styles.ticker}>
  <div style={styles.tickerMove}>
    {games.map(g => (
      <span key={g.id} style={styles.tickerItem}>
        {g.steam && "🔥 STEAM "}
        {g.ev > 4 && "🧠 EV "}
        {g.away}@{g.home} {g.homeOdds}
      </span>
    ))}
  </div>
</div>

{/* ✅ ADDED PANEL (minimal, same style) */}
<div style={{
  background:"rgba(20,10,40,0.6)",
  padding:"10px",
  borderRadius:"10px",
  marginBottom:"15px"
}}>
  <h3 style={{fontSize:"14px", marginBottom:"6px"}}>Alert History</h3>

  {alertHistory.length === 0 && (
    <div style={{opacity:0.5}}>No alerts yet</div>
  )}

  {alertHistory.map(a => (
    <div key={a.id} style={{fontSize:"12px", marginBottom:"4px"}}>
      {a.text}
    </div>
  ))}
</div>

{/* AI BUILDER */}
<div style={{
  ...styles.aiBuilder,
  ...(!isPro && styles.blur)
}}>
  <h3>AI Bet Builder</h3>

  <div style={styles.aiDescription}>
    AI scans EV, confidence, and steam to build optimal parlays.
  </div>

  {!isPro && (
    <div style={styles.lockOverlay}>
      <p>🔒 PRO ONLY</p>
      <button onClick={handleUpgrade}>Upgrade</button>
    </div>
  )}

  <div style={styles.aiButtons}>
    <button onClick={()=>buildAIParlayAdvanced("safe")}>🟢 Safe</button>
    <button onClick={()=>buildAIParlayAdvanced("balanced")}>⚖️ Balanced</button>
    <button onClick={()=>buildAIParlayAdvanced("aggressive")}>🔥 Aggressive</button>
  </div>
</div>

{/* MARKETS */}
{games.map(g => (
  <div key={g.id} style={styles.row}>
    {g.away} @ {g.home}
    <span onClick={()=>addToSlip(g)} style={styles.oddsBtn}>
      {g.homeOdds}
    </span>
  </div>
))}

/* BET SLIP */
<div style={styles.slip}>
  <h3>Bet Slip</h3>

  {betSlip.map(b => (
    <div key={b.id} style={styles.betCard}>
      {b.away}@{b.home}

      <div style={styles.reason}>
        🧠 EV: {b.ev}% | 📊 Conf: {b.confidence}%
        {b.steam && " | 🔥 Steam"}
      </div>

      <div style={styles.prob}>
        Win: {getWinProbability(b.homeOdds, b.confidence)}%
      </div>

      <button onClick={()=>removeBet(b.id)}>x</button>
    </div>
  ))}

  <input value={stake} onChange={(e)=>setStake(e.target.value)} />

  <div style={styles.total}>${payout()}</div>

  <div style={styles.probTotal}>
    Parlay Chance: {parlayProbability()}%
  </div>
</div>

</div>
);
}

/* ================= STYLE ================= */

const styles = {
page:{ background:"#000", color:"#fff", padding:"20px" },
loading:{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" },

alertContainer:{
  position:"fixed",
  top:"20px",
  right:"20px",
  zIndex:999
},

alert:{
  background:"#111",
  color:"#00ffcc",
  padding:"10px",
  marginBottom:"10px",
  borderRadius:"8px",
  border:"1px solid #00ffcc"
},

header:{ display:"flex", justifyContent:"space-between", alignItems:"center" },
headerRight:{ display:"flex", gap:"10px", alignItems:"center" },

logo:{
fontSize:"32px",
fontWeight:"900",
background:"linear-gradient(90deg,#9333ea,#22d3ee,#00ffcc)",
WebkitBackgroundClip:"text",
WebkitTextFillColor:"transparent"
},

live:{ color:"#00ffcc" },

proBadge:{ background:"#00ffcc", color:"#000", padding:"4px 10px", borderRadius:"6px" },
freeBadge:{ background:"#333", color:"#aaa", padding:"4px 10px", borderRadius:"6px" },

ticker:{ overflow:"hidden", margin:"10px 0" },
tickerMove:{ display:"inline-block", animation:"scroll 18s linear infinite" },
tickerItem:{ marginRight:"30px", color:"#00ffcc" },

row:{ display:"flex", justifyContent:"space-between", marginBottom:"10px" },
oddsBtn:{ cursor:"pointer", color:"#00ffcc" },

slip:{ marginTop:"20px" },

aiBuilder:{ background:"#111", padding:"20px", borderRadius:"12px", marginBottom:"20px", position:"relative" },
aiButtons:{ display:"flex", gap:"10px" },
aiDescription:{ fontSize:"12px", opacity:0.7, marginBottom:"10px" },

blur:{ filter:"blur(4px)", pointerEvents:"none" },

lockOverlay:{
position:"absolute",
top:0,left:0,right:0,bottom:0,
display:"flex",
flexDirection:"column",
justifyContent:"center",
alignItems:"center",
background:"rgba(0,0,0,0.7)"
},

betCard:{
  background:"#111",
  padding:"10px",
  marginBottom:"10px",
  borderRadius:"8px"
},

reason:{ fontSize:"11px", opacity:0.7 },
prob:{ color:"#00ffcc", fontSize:"12px" },
probTotal:{ marginTop:"8px", color:"#00ffcc" }
};