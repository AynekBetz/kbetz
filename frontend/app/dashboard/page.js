"use client";

import { useEffect, useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Dashboard() {

const [games, setGames] = useState([]);
const [alerts, setAlerts] = useState([]);
const [user, setUser] = useState(null);
const [topPicks, setTopPicks] = useState([]);

const isPro = user?.isPro === true || user?.plan === "pro";

/* =========================
AUTH
========================= */
const handleLogout = () => {
localStorage.removeItem("token");
localStorage.removeItem("email");
window.location.href = "/login";
};

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

if (!data || data.error) {
localStorage.removeItem("token");
window.location.href = "/login";
return;
}

setUser(data);

if (data.email) {
localStorage.setItem("email", data.email);
}
};

/* =========================
AI
========================= */
const impliedProb = (odds) => {
if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
return 100 / (odds + 100);
};

const generateAI = (games) => {
const evaluated = games.map((g) => {
const prob = impliedProb(g.odds);
const trueProb = prob + (Math.random() * 0.06);

const ev = (trueProb * 100) - (1 - trueProb) * Math.abs(g.odds);
const confidence = Math.min(95, Math.max(55, Math.floor(trueProb * 100)));

return { ...g, ev, confidence };
});

const sorted = evaluated.sort((a, b) => b.ev - a.ev);
setTopPicks(sorted.slice(0, 3));
};

/* =========================
DATA
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

/* =========================
UPGRADE
========================= */
const handleUpgradeClick = () => {
const email = localStorage.getItem("email");

fetch(`${API}/api/checkout`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email })
})
.then(res => res.json())
.then(data => {
if (data.url) window.location.href = data.url;
});
};

/* =========================
UI
========================= */
if (!user) return <div style={{color:"white"}}>Loading...</div>;

return (

<div style={styles.page}>

{/* HEADER */}
<div style={styles.header}>
<h1 style={styles.logo}>KBETZ TERMINAL</h1>

<div style={styles.right}>
<span style={{color:"#22c55e"}}>
{isPro ? "PRO" : "FREE"}
</span>

<button onClick={handleLogout} style={styles.btnDark}>
Logout
</button>

{!isPro && (
<button onClick={handleUpgradeClick} style={styles.btnPro}>
Upgrade PRO
</button>
)}

</div>
</div>

{/* =========================
🔥 AI PICKS (UPDATED WITH BLUR)
========================= */}

<div style={{
...styles.card,
position: "relative"
}}>

<h2>🧠 AI PICKS</h2>

{/* BLUR CONTENT */}
<div style={{
filter: !isPro ? "blur(6px)" : "none",
pointerEvents: !isPro ? "none" : "auto"
}}>

{topPicks.map((p,i)=>(
<div key={i} style={styles.pick}>

<div style={styles.row}>
<span>{p.away} @ {p.home}</span>
<span style={{color:"#00ff99"}}>{p.odds}</span>
</div>

<div style={{fontSize:"12px"}}>
EV +{p.ev?.toFixed(2)}% • {p.confidence}%
</div>

</div>
))}

</div>

{/* PRO OVERLAY */}
{!isPro && (
<div style={styles.overlay}>
<div style={{fontSize:"18px",marginBottom:"10px"}}>
🔒 PRO ONLY
</div>

<button onClick={handleUpgradeClick} style={styles.unlockBtn}>
Unlock AI Picks
</button>
</div>
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
gap:"10px",
alignItems:"center"
},

btnDark:{
background:"#222",
padding:"8px 12px",
borderRadius:"6px",
border:"none",
color:"white",
cursor:"pointer"
},

btnPro:{
background:"linear-gradient(90deg,gold,orange)",
padding:"10px 18px",
borderRadius:"8px",
border:"none",
fontWeight:"bold",
cursor:"pointer"
},

card:{
background:"rgba(255,255,255,0.05)",
padding:"20px",
borderRadius:"14px",
marginBottom:"20px"
},

pick:{
padding:"10px",
marginBottom:"10px",
background:"#0a0a0a",
borderRadius:"10px"
},

row:{
display:"flex",
justifyContent:"space-between"
},

overlay:{
position:"absolute",
top:0,
left:0,
right:0,
bottom:0,
display:"flex",
flexDirection:"column",
justifyContent:"center",
alignItems:"center",
background:"rgba(0,0,0,0.7)",
borderRadius:"14px"
},

unlockBtn:{
marginTop:"10px",
background:"#00ff99",
border:"none",
padding:"8px 12px",
cursor:"pointer"
}

};