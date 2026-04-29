"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

const API = "https://kbetz-backend.onrender.com";

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);

/* ================= FETCH ================= */
useEffect(() => {
  fetchGames();
}, []);

const fetchGames = async () => {
  try {
    const res = await fetch(`${API}/api/data`);
    const data = await res.json();

    let list = data.games;

    // 🔥 fallback so UI ALWAYS shows something
    if (!list || list.length === 0) {
      list = [
        {
          id:"1",
          home:"Lakers",
          away:"Warriors",
          homeOdds:-110,
          ev:9.7,
          confidence:57,
          books:[
            {name:"DK",home:-110},
            {name:"FD",home:-105}
          ]
        },
        {
          id:"2",
          home:"Celtics",
          away:"Heat",
          homeOdds:-105,
          ev:4.8,
          confidence:55,
          books:[
            {name:"DK",home:-105},
            {name:"FD",home:-100}
          ]
        }
      ];
    }

    setGames(list);

  } catch (err) {
    console.log(err);
  }
};

/* ================= BET ================= */
const addToSlip = (g) => setBetSlip([...betSlip, g]);

const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

const payout = () => {
  const odds = betSlip.reduce((a,b)=>a*toDecimal(b.homeOdds||-110),1);
  return (stake * odds).toFixed(2);
};

/* ================= AI PICKS ================= */
const aiPicks = games.slice(0,2);

/* ================= UI ================= */
return (
<div style={styles.page}>

  {/* 🔴 TEST BUILD (DO NOT REMOVE YET) */}
  <div style={{color:"red", fontSize:"22px", marginBottom:"10px"}}>
    TEST BUILD
  </div>

  <h1 style={styles.logo}>KBETZ TERMINAL</h1>

  {/* AI HERO */}
  <div style={styles.aiHero}>
    <h2>🧠 AI PICKS</h2>

    {aiPicks.map((g)=>(
      <div key={g.id} style={styles.aiRow}>

        <div>
          <div style={styles.game}>{g.away} @ {g.home}</div>

          <div style={styles.meta}>
            EV: +{g.ev}% &nbsp;
            Conf: {g.confidence}% &nbsp;
          </div>
        </div>

        <div style={styles.oddsRed}>
          {g.homeOdds}
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

      return(
        <div key={g.id} style={styles.marketRow}>

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

logo:{color:"#00ff99",textShadow:"0 0 10px #00ff99"},

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

game:{fontWeight:"bold"},
meta:{fontSize:"12px",color:"#ccc"},
oddsRed:{color:"red",fontWeight:"bold"},

marketBox:{
  background:"#0a0a0a",
  padding:"15px",
  borderRadius:"10px"
},

marketRow:{
  display:"flex",
  justifyContent:"space-between",
  padding:"10px",
  marginBottom:"5px",
  background:"#050505",
  borderRadius:"6px"
},

odds:{color:"#00ff99",border:"none",background:"transparent"},
best:{background:"#00ff99",color:"#000",padding:"5px"},

slip:{
  position:"fixed",
  right:"20px",
  top:"120px",
  width:"250px",
  background:"#000",
  border:"1px solid #00ff99",
  padding:"10px"
},

betBtn:{background:"#00ff99",color:"#000",padding:"8px"}

};