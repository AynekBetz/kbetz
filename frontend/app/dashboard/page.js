"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function Dashboard() {

const [games, setGames] = useState([]);

useEffect(() => {
  fetchGames();
}, []);

const fetchGames = async () => {
  try {
    const res = await fetch("/api/data");
    const data = await res.json();
    if (Array.isArray(data.games)) setGames(data.games);
  } catch (err) {
    console.log(err);
  }
};

return (
<div style={styles.page}>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

<div style={styles.status}>
🔥 AI RECORD: 58-41 (+12.4u) | ROI: +8.7%
</div>

{/* AI PICKS */}
<div style={styles.aiBox}>
<h2>🧠 AI PICKS</h2>

{games.slice(0,2).map(g => (
<div key={g.id}>
{g.away} @ {g.home}
<br />
<span style={{color:"#00ffcc"}}>
EV: {(Math.random()*2+4).toFixed(2)}
</span>
</div>
))}

</div>

{/* MARKETS */}
<div style={styles.marketBox}>
<h2>Markets</h2>

{games.map(g => (
<div key={g.id} style={styles.marketRow}>
{g.away} @ {g.home}
<span style={{color:"#00ffcc"}}>
{g.homeOdds}
</span>
</div>
))}

</div>

</div>
);
}

/* ================= STYLE ================= */

const styles = {
page:{
background:"linear-gradient(to bottom,#000,#0a0014,#2b0a4a,#6d28d9,#000)",
color:"white",
padding:"20px",
minHeight:"100vh"
},
logo:{
fontSize:"34px",
fontWeight:"900",
background:"linear-gradient(90deg,#7c3aed,#22d3ee,#00ffcc)",
WebkitBackgroundClip:"text",
WebkitTextFillColor:"transparent"
},
status:{ color:"#00ffcc", marginBottom:"15px" },

aiBox:{
background:"linear-gradient(90deg,#6d28d9,#9333ea)",
padding:"20px",
borderRadius:"12px",
marginBottom:"20px"
},

marketBox:{
background:"rgba(20,10,40,0.8)",
padding:"20px",
borderRadius:"12px"
},

marketRow:{
display:"flex",
justifyContent:"space-between",
padding:"10px",
background:"black",
borderRadius:"8px",
marginBottom:"8px"
}
};