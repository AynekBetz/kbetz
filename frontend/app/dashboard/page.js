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
  } catch {}
};

return (
<div style={styles.page}>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

<div style={styles.status}>
🔥 AI RECORD: 58-41 (+12.4u) | ROI: +8.7%
</div>

{/* AI PICKS */}
<div style={styles.aiCard}>
<h2 style={styles.aiTitle}>🧠 AI PICKS</h2>

{games.slice(0,2).map(g => (
<div key={g.id} style={styles.pick}>
{g.away} @ {g.home}
<div style={styles.ev}>EV: 6.30</div>
</div>
))}

</div>

{/* MARKETS */}
<div style={styles.marketCard}>
<h2>Markets</h2>

{games.map(g => (
<div key={g.id} style={styles.marketRow}>
<span>{g.away} @ {g.home}</span>
<span style={styles.odds}>{g.homeOdds}</span>
</div>
))}

</div>

</div>
);
}

/* ================= STYLES ================= */

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

status:{ color:"#00ffcc", marginBottom:"20px" },

aiCard:{
background:"linear-gradient(90deg,#6d28d9,#9333ea)",
padding:"20px",
borderRadius:"14px",
marginBottom:"20px"
},

aiTitle:{
marginBottom:"10px"
},

pick:{
marginBottom:"10px"
},

ev:{
color:"#00ffcc"
},

marketCard:{
background:"rgba(20,10,40,0.8)",
padding:"20px",
borderRadius:"14px"
},

marketRow:{
display:"flex",
justifyContent:"space-between",
padding:"12px",
background:"#000",
borderRadius:"10px",
marginBottom:"10px"
},

odds:{
color:"#00ffcc"
}
};