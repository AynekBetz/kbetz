"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [user, setUser] = useState(null);
const [topPicks, setTopPicks] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

const isPro = user?.isPro === true || user?.plan === "pro";

/* =========================
AUTH
========================= */
useEffect(() => {
fetchUser();
fetchGames();
const interval = setInterval(fetchGames, 5000);
return () => clearInterval(interval);
}, []);

const fetchUser = async () => {
const token = localStorage.getItem("token");
if (!token) return (window.location.href = "/login");

const res = await fetch(`${API}/api/me`, {
headers: { Authorization: `Bearer ${token}` }
});
const data = await res.json();
setUser(data);

if (data.email) localStorage.setItem("email", data.email);
};

/* =========================
DATA + AI
========================= */
const fetchGames = async () => {
try {
const res = await fetch(`${API}/api/data`);
const data = await res.json();

const g = data.games || [];
setGames(g);
generateAI(g);

} catch {}
};

const generateAI = (games) => {
setTopPicks(games.slice(0,3));
};

/* =========================
BET SLIP
========================= */

const addToSlip = (game) => {
const exists = betSlip.find(b => b.id === game.id);
if (exists) return;

setBetSlip([...betSlip, game]);
};

const removeBet = (id) => {
setBetSlip(betSlip.filter(b => b.id !== id));
};

const americanToDecimal = (odds) => {
if (odds > 0) return (odds / 100) + 1;
return (100 / Math.abs(odds)) + 1;
};

const parlayOdds = () => {
if (!betSlip.length) return 0;

return betSlip.reduce((acc, bet) => {
return acc * americanToDecimal(bet.odds);
}, 1);
};

const payout = (stakeAmount = 100) => {
return (stakeAmount * parlayOdds()).toFixed(2);
};

/* =========================
UPGRADE
========================= */
const handleUpgradeClick = async () => {
const email = localStorage.getItem("email");

const res = await fetch(`${API}/api/checkout`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email })
});

const data = await res.json();
if (data.url) window.location.href = data.url;
};

/* =========================
UI
========================= */
if (!user) return <div style={{color:"white"}}>Loading...</div>;

return (

<div style={styles.page}>

{/* LEFT SIDE */}
<div style={{flex:1}}>

{/* HEADER */}
<div style={styles.header}>
<h1 style={styles.logo}>KBETZ TERMINAL</h1>

<div style={styles.right}>
<span>{isPro ? "PRO" : "FREE"}</span>

{!isPro && (
<button onClick={handleUpgradeClick} style={styles.btnPro}>
Upgrade
</button>
)}
</div>
</div>

{/* AI PICKS */}
<div style={{...styles.card, position:"relative"}}>

<h2>🧠 AI PICKS</h2>

<div style={{
filter: !isPro ? "blur(6px)" : "none",
pointerEvents: !isPro ? "none" : "auto"
}}>

{topPicks.map((p,i)=>(
<div key={i} style={styles.pick}>

<div style={styles.row}>
<span>{p.away} @ {p.home}</span>

<button
onClick={()=>addToSlip(p)}
style={styles.oddsBtn}
>
{p.odds}
</button>

</div>

</div>
))}

</div>

{!isPro && (
<div style={styles.overlay}>
<div>🔒 PRO ONLY</div>
<button onClick={handleUpgradeClick}>
Unlock
</button>
</div>
)}

</div>

{/* LIVE MARKETS */}
<div style={styles.card}>
<h2>📈 LIVE MARKETS</h2>

{games.map(g=>(
<div key={g.id} style={styles.marketRow}>

<span>{g.away} @ {g.home}</span>

<button
onClick={()=>addToSlip(g)}
style={styles.oddsBtn}
>
{g.odds}
</button>

</div>
))}

</div>

</div>

{/* BET SLIP */}
<div style={styles.slip}>

<h3>🧾 Bet Slip</h3>

{betSlip.length === 0 && <p>No bets yet</p>}

{betSlip.map((b)=>(
<div key={b.id} style={styles.slipItem}>

<span>{b.away} @ {b.home}</span>

<div>
<span>{b.odds}</span>

<button onClick={()=>removeBet(b.id)}>
✖
</button>
</div>

</div>
))}

{betSlip.length > 0 && (
<>
<hr/>

<input
type="number"
value={stake}
onChange={(e)=>setStake(Number(e.target.value))}
style={styles.stakeInput}
/>

<div>
Parlay Odds: {parlayOdds().toFixed(2)}x
</div>

<div style={{fontSize:"18px", fontWeight:"bold"}}>
Payout: ${payout(stake)}
</div>

<button style={styles.placeBtn}>
Place Bet
</button>

<button
onClick={()=>setBetSlip([])}
style={styles.clearBtn}
>
Clear Slip
</button>

</>
)}

</div>

</div>
);
}

/* =========================
STYLES
========================= */

const styles = {

page:{
display:"flex",
background:"#050505",
color:"white",
minHeight:"100vh",
padding:"20px",
fontFamily:"Inter"
},

header:{
display:"flex",
justifyContent:"space-between",
marginBottom:"20px"
},

logo:{
fontSize:"26px",
background:"linear-gradient(90deg,#00ff99,#00cc66)",
WebkitBackgroundClip:"text",
color:"transparent"
},

right:{
display:"flex",
gap:"10px"
},

card:{
background:"rgba(255,255,255,0.05)",
padding:"15px",
borderRadius:"12px",
marginBottom:"20px"
},

pick:{
padding:"10px",
marginBottom:"10px",
background:"#111",
borderRadius:"8px"
},

row:{
display:"flex",
justifyContent:"space-between"
},

oddsBtn:{
background:"#111",
border:"1px solid #333",
color:"#00ff99",
padding:"6px 10px",
cursor:"pointer"
},

marketRow:{
display:"flex",
justifyContent:"space-between",
padding:"10px",
borderBottom:"1px solid #222"
},

overlay:{
position:"absolute",
top:0,left:0,right:0,bottom:0,
display:"flex",
justifyContent:"center",
alignItems:"center",
flexDirection:"column",
background:"rgba(0,0,0,0.7)"
},

slip:{
width:"300px",
background:"#0a0a0a",
padding:"15px",
borderRadius:"12px"
},

slipItem:{
display:"flex",
justifyContent:"space-between",
marginBottom:"10px"
},

placeBtn:{
marginTop:"10px",
background:"#00ff99",
border:"none",
padding:"10px",
width:"100%",
cursor:"pointer"
},

clearBtn:{
marginTop:"8px",
background:"#222",
border:"none",
padding:"8px",
width:"100%",
color:"#ccc",
cursor:"pointer"
},

stakeInput:{
marginTop:"10px",
padding:"8px",
width:"100%",
background:"#111",
border:"1px solid #333",
color:"white"
},

btnPro:{
background:"gold",
border:"none",
padding:"8px 12px",
cursor:"pointer"
}

};