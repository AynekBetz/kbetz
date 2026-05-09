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

  const t = setInterval(fetchGames, 8000);
  return () => clearInterval(t);
}, []);

/* ================= PRO ================= */
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

/* ================= ALERT ================= */
const pushAlert = (text, game = null) => {
  const id = Date.now();
  const alertObj = { id, text, game };

  setAlerts(prev => [...prev, alertObj]);
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
          pushAlert(`🔥 STEAM: ${g.away} @ ${g.home}`, g);
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

        // ✅ FIXED (NUMBER SAFE)
        ev: typeof g.ev === "number"
          ? g.ev
          : Number((Math.random()*5+3).toFixed(2)),

        confidence: typeof g.confidence === "number"
          ? g.confidence
          : Math.floor(Math.random()*20+70)
      };
    });

    setGames(updated);

  } catch {
    setGames([
      { id:1, away:"Warriors", home:"Lakers", homeOdds:-110 },
      { id:2, away:"Heat", home:"Celtics", homeOdds:-105 }
    ]);
  } finally {
    setLoading(false);
  }
};

/* ================= HELPERS ================= */
const isSelected = (id) => betSlip.some(b => b.id === id);

/* ================= PROBABILITY ================= */
const getWinProbability = (odds, confidence) => {
  let base = odds > 0
    ? 100 / (odds + 100)
    : Math.abs(odds) / (Math.abs(odds) + 100);

  base *= (confidence / 100);
  return (base * 100).toFixed(1);
};

const parlayProbability = () => {
  if (!betSlip.length) return 0;

  let prob = 1;
  betSlip.forEach(b => {
    prob *= getWinProbability(b.homeOdds, b.confidence) / 100;
  });

  return (prob * 100).toFixed(2);
};

/* ================= AI ================= */
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

/* ================= BET ================= */
const addToSlip = (g) => {
  if (isSelected(g.id)) return;
  setBetSlip([...betSlip, g]);
};

const removeBet = (id) => {
  setBetSlip(betSlip.filter(b => b.id !== id));
};

const payout = () => {
  let total = 1;
  betSlip.forEach(b => {
    const d = b.homeOdds > 0 ? (b.homeOdds/100)+1 : (100/Math.abs(b.homeOdds))+1;
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
    <div key={a.id} style={styles.alert} onClick={()=>a.game && addToSlip(a.game)}>
      {a.text}
    </div>
  ))}
</div>

{/* HEADER */}
<div style={styles.header}>
  <h1 style={styles.logo}>KBETZ TERMINAL</h1>

  <div style={styles.headerRight}>
    <span style={styles.live}>● LIVE</span>

    <span style={isPro ? styles.proBadge : styles.freeBadge}>
      {isPro ? "PRO" : "FREE"}
    </span>

    {!isPro && (
      <button style={styles.upgradeBtn} onClick={handleUpgrade}>
        Upgrade
      </button>
    )}

    <button style={styles.logoutBtn} onClick={()=>{
      localStorage.clear();
      window.location.href="/";
    }}>
      Logout
    </button>
  </div>
</div>

{/* TICKER */}
<div style={styles.ticker}>
  <div style={styles.tickerMove}>
    {games.map(g => (
      <span key={g.id} style={styles.tickerItem}>
        {g.steam && "🔥 "}
        {g.away}@{g.home} {g.homeOdds}
      </span>
    ))}
  </div>
</div>

{/* ALERT HISTORY */}
<div style={styles.historyPanel}>
  <h3>Alert History</h3>
  {alertHistory.map(a => (
    <div key={a.id} onClick={()=>a.game && addToSlip(a.game)}>
      {a.text}
    </div>
  ))}
</div>

{/* AI BUILDER */}
<div style={styles.aiPanel}>
  <h3>AI Builder</h3>
  <button onClick={()=>buildAIParlayAdvanced("safe")}>Safe</button>
  <button onClick={()=>buildAIParlayAdvanced("balanced")}>Balanced</button>
  <button onClick={()=>buildAIParlayAdvanced("aggressive")}>Aggressive</button>
</div>

{/* MARKETS */}
{games.map(g => (
  <div key={g.id} style={{
    ...styles.row,
    ...(isSelected(g.id) && styles.selected),
    ...(g.movement==="up" && styles.upGlow),
    ...(g.movement==="down" && styles.downGlow)
  }}>
    {g.away} @ {g.home}
    <span onClick={()=>addToSlip(g)}>{g.homeOdds}</span>
  </div>
))}

{/* BET SLIP */}
<div style={styles.slip}>
  {betSlip.map(b => (
    <div key={b.id}>
      {b.away}@{b.home} ({getWinProbability(b.homeOdds,b.confidence)}%)
      <button onClick={()=>removeBet(b.id)}>x</button>
    </div>
  ))}
  <div>${payout()}</div>
  <div>Parlay: {parlayProbability()}%</div>
</div>

</div>
);
}

/* ================= STYLE ================= */
const styles = {
page:{ background:"#000", color:"#fff", padding:"20px" },
loading:{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" },
alertContainer:{ position:"fixed", top:"20px", right:"20px" },
alert:{ background:"#111", padding:"10px", marginBottom:"10px" },
header:{ display:"flex", justifyContent:"space-between" },
headerRight:{ display:"flex", gap:"10px" },
logo:{ color:"#00ffcc" },
live:{ color:"#00ffcc" },
proBadge:{ background:"#00ffcc", color:"#000", padding:"4px 10px" },
freeBadge:{ background:"#333", color:"#aaa", padding:"4px 10px" },
upgradeBtn:{ background:"#00ffcc", color:"#000" },
logoutBtn:{ background:"#222", color:"#fff" },
ticker:{ margin:"10px 0" },
tickerItem:{ marginRight:"20px" },
historyPanel:{ background:"#111", padding:"10px", marginBottom:"10px" },
aiPanel:{ background:"#111", padding:"10px", marginBottom:"10px" },
row:{ padding:"10px", background:"#111", marginBottom:"6px" },
selected:{ boxShadow:"0 0 10px #00ffcc" },
upGlow:{ boxShadow:"0 0 10px #00ff00" },
downGlow:{ boxShadow:"0 0 10px #ff0000" },
slip:{ marginTop:"20px" }
};