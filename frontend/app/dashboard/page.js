"use client";

// 🔒 KBETZ FINAL INSANE BUILD (NO FEATURE LOSS)

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const API = "https://kbetz-main.onrender.com";

  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [bankroll, setBankroll] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [ticker, setTicker] = useState([]);
  const [roi, setROI] = useState(null);

  const [arbOps, setArbOps] = useState([]);
  const [steamGames, setSteamGames] = useState([]);
  const [history, setHistory] = useState([]);

  const [flash, setFlash] = useState({});
  const [hovered, setHovered] = useState(null);
  const [lineHistory, setLineHistory] = useState({});

  const prevOdds = useRef({});
  const audioRef = useRef(null);

  const FLAGS = { SOUND:true, FLASH:true };

  useEffect(() => {
    const email = localStorage.getItem("email");
    loadAll(email);

    const socket = io(API, { transports:["websocket"] });

    socket.on("oddsUpdate", (data)=>{
      if(data?.games){
        processGames(data.games);

        // 🔥 line tracking
        setLineHistory(prev=>{
          const updated={...prev};
          data.games.forEach(g=>{
            const key=g.id||`${g.home}-${g.away}`;
            if(!updated[key]) updated[key]=[];
            updated[key].push({value:g.homeOdds});
            if(updated[key].length>20) updated[key].shift();
          });
          return updated;
        });
      }
    });

    return ()=>socket.disconnect();
  },[]);

  useEffect(()=>{ audioRef.current=new Audio("/alert.mp3"); },[]);

  const americanToProb = (odds)=>{
    odds=parseFloat(odds);
    return odds>0?100/(odds+100):Math.abs(odds)/(Math.abs(odds)+100);
  };

  const loadAll = async(email)=>{
    const user=await fetch(`${API}/api/me?email=${email}`).then(r=>r.json());
    const roiData=await fetch(`${API}/api/roi?email=${email}`).then(r=>r.json());
    const odds=await fetch(`${API}/api/odds`).then(r=>r.json());

    setBankroll(user?.bankroll||0);
    setIsPro(user?.isPro||false);
    setROI(roiData);

    processGames(odds?.games||[]);
  };

  const processGames = (games)=>{
    const updated=games.map(g=>{
      const key=g.id||`${g.home}-${g.away}`;
      const prev=prevOdds.current[key];

      let movement="";
      if(prev&&prev!==g.homeOdds){
        movement=g.homeOdds>prev?"up":"down";

        if(FLAGS.FLASH){
          setFlash(prev=>({...prev,[key]:movement}));
          setTimeout(()=>setFlash(prev=>({...prev,[key]:""})),400);
        }

        if(FLAGS.SOUND){
          try{audioRef.current?.play()}catch{}
        }
      }

      prevOdds.current[key]=g.homeOdds;

      const implied=americanToProb(g.homeOdds);
      const model=movement==="up"?implied+0.03:implied-0.01;
      const edge=((model-implied)*100);

      return {...g,movement,edge,key};
    });

    const sorted=[...updated].sort((a,b)=>b.edge-a.edge);

    setGames(sorted);
    setTicker(sorted.map(g=>`${g.away} @ ${g.home}`));

    // arb
    const arb=sorted.filter(g=>{
      if(!g.books||g.books.length<2) return false;
      const probs=g.books.map(b=>americanToProb(b.odds));
      const total=probs.reduce((a,b)=>a+b,0);
      g.arbEdge=((1-total)*100).toFixed(2);
      return total<1;
    });

    setArbOps(arb.slice(0,3));

    // steam
    const steam=sorted.filter(g=>g.movement==="up").map(g=>({
      ...g,
      strength:Math.abs(g.edge).toFixed(2)
    }));

    setSteamGames(steam.slice(0,3));
  };

  const addToParlay=(g)=>{
    setParlay(prev=>[...prev,g]);
    setHistory(prev=>[...prev,g].slice(-10));
  };

  const removeFromParlay=(i)=>{
    setParlay(prev=>prev.filter((_,idx)=>idx!==i));
  };

  const payout=parlay.reduce((acc,g)=>{
    const o=parseFloat(g.homeOdds);
    return acc*(1+o/100);
  },1).toFixed(2);

  const upgrade=async()=>{
    const email=localStorage.getItem("email");
    const res=await fetch(`${API}/api/checkout`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email})
    });
    const data=await res.json();
    if(data.url) window.location.href=data.url;
  };

  return (
    <div style={styles.page}>

      <h1 style={styles.logo}>KBETZ TERMINAL</h1>

      <div style={styles.ticker}>{ticker.join(" • ")}</div>

      <div style={styles.bankroll}>💰 ${bankroll}</div>

      {/* TOP */}
      <div style={styles.gridTop}>

        <div>
          <div style={styles.cardMain}>
            <h2>ROI</h2>
            <div style={!isPro?styles.blur:{}}>
              <div>ROI: {roi?.roi||"--"}%</div>
              <div>Profit: ${roi?.profit||"--"}</div>
            </div>

            {!isPro && (
              <button style={styles.upgrade} onClick={upgrade}>
                🔓 Upgrade to PRO
              </button>
            )}
          </div>

          <div style={styles.cardMain}>
            <h2>AI SIGNALS</h2>
            {games.slice(0,3).map((g,i)=>(
              <div key={i} style={styles.row}>
                {g.home}
                <span style={styles.edge}>+{g.edge.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.cardMain}>
          <h2>BETSLIP</h2>
          {parlay.map((p,i)=>(
            <div key={i} style={styles.row}>
              {p.home}
              <button onClick={()=>removeFromParlay(i)}>❌</button>
            </div>
          ))}
          <div>Payout: {payout}x</div>
        </div>

      </div>

      {/* MARKETS */}
      <div style={styles.cardBig}>
        <h2>LIVE MARKETS</h2>

        {games.map((g,i)=>(
          <div key={i} style={styles.marketRow}>
            <div>{g.away} @ {g.home}</div>

            <div style={{width:80,height:30}}>
              <ResponsiveContainer>
                <LineChart data={lineHistory[g.key]||[]}>
                  <Line dataKey="value" stroke="#00ffe1" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <button style={styles.odds} onClick={()=>addToParlay(g)}>
              {g.homeOdds}
            </button>
          </div>
        ))}
      </div>

      {/* BOTTOM */}
      <div style={styles.gridBottom}>
        <div style={styles.card}><h2>ARBITRAGE</h2>{arbOps.map((g,i)=>(<div key={i}>{g.home} +{g.arbEdge}%</div>))}</div>
        <div style={styles.card}><h2>STEAM</h2>{steamGames.map((g,i)=>(<div key={i}>{g.home} ↑ {g.strength}%</div>))}</div>
        <div style={styles.card}><h2>HISTORY</h2>{history.map((h,i)=>(<div key={i}>{h.home}</div>))}</div>
      </div>

    </div>
  );
}

const styles={
  page:{padding:20,minHeight:"100vh",background:"radial-gradient(circle at top,#021919,#000)",color:"#fff"},
  logo:{fontSize:40,fontWeight:"bold",background:"linear-gradient(90deg,#00ffe1,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  ticker:{color:"#00ffe1",marginBottom:15},
  bankroll:{marginBottom:15},

  gridTop:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20},
  gridBottom:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:15,marginTop:20},

  cardMain:{background:"rgba(10,15,15,0.9)",padding:18,borderRadius:14,marginBottom:15},
  cardBig:{background:"rgba(10,15,15,0.9)",padding:20,borderRadius:14,marginTop:20},
  card:{background:"rgba(10,15,15,0.85)",padding:15,borderRadius:12},

  row:{display:"flex",justifyContent:"space-between",padding:10},
  marketRow:{display:"flex",justifyContent:"space-between",padding:12,marginBottom:8},

  odds:{background:"linear-gradient(90deg,#00ffe1,#00c2ff)",border:"none",padding:"6px 12px",borderRadius:6,color:"#000"},
  edge:{color:"#00ffe1"},

  upgrade:{marginTop:10,background:"linear-gradient(90deg,#00ffe1,#7c3aed)",border:"none",padding:"10px 14px",borderRadius:8,color:"#000"},
  blur:{filter:"blur(5px)"}
};