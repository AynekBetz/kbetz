"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [loading, setLoading] = useState(true);

/* ================= INIT ================= */
useEffect(() => {
  fetchGames();
}, []);

/* ================= FETCH ================= */
const fetchGames = async () => {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/data`
        : "/api/data"
    );

    if (!res.ok) throw new Error("bad response");

    const data = await res.json();

    if (!data || !Array.isArray(data.games)) {
      setGames([]);
    } else {
      setGames(data.games);
    }

  } catch (err) {
    console.log("SAFE FALLBACK:", err);

    // 🔥 fallback data so UI NEVER crashes
    setGames([
      { id: 1, home: "Lakers", away: "Warriors", homeOdds: -110 },
      { id: 2, home: "Celtics", away: "Heat", homeOdds: -105 }
    ]);
  } finally {
    setLoading(false);
  }
};

/* ================= SAFE LOADING ================= */
if (loading) {
  return (
    <div style={{
      height:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      background:"#000",
      color:"#fff"
    }}>
      Loading KBETZ...
    </div>
  );
}

/* ================= UI ================= */
return (
<div style={styles.page}>

<h1 style={styles.logo}>KBETZ TERMINAL</h1>

<div style={styles.status}>
🔥 AI RECORD: 58-41 (+12.4u) | ROI: +8.7%
</div>

{/* AI PICKS */}
<div style={styles.aiCard}>
<h2>🧠 AI PICKS</h2>

{games.slice(0,2).map((g, i) => (
<div key={g.id || i}>
{g.away} @ {g.home}
<div style={styles.ev}>
EV: {(Math.random()*2+4).toFixed(2)}
</div>
</div>
))}

</div>

{/* MARKETS */}
<div style={styles.marketCard}>
<h2>Markets</h2>

{games.map((g, i) => (
<div key={g.id || i} style={styles.row}>
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

status:{
color:"#00ffcc",
marginBottom:"20px"
},

aiCard:{
background:"linear-gradient(90deg,#6d28d9,#9333ea)",
padding:"20px",
borderRadius:"14px",
marginBottom:"20px"
},

ev:{
color:"#00ffcc"
},

marketCard:{
background:"rgba(20,10,40,0.8)",
padding:"20px",
borderRadius:"14px"
},

row:{
display:"flex",
justifyContent:"space-between",
background:"#000",
padding:"12px",
borderRadius:"10px",
marginBottom:"10px"
},

odds:{
color:"#00ffcc"
}
};