"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const API = "https://kbetz.onrender.com";

/* ================= UTILS ================= */
const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

// 💰 Hedge / Cashout calculator (same market or cross-market approximation)
const calcHedge = (oddsA, oddsB, stakeA=100) => {
  const d1 = toDecimal(oddsA);
  const d2 = toDecimal(oddsB);

  // balance payouts so either side returns ~same
  const stakeB = (stakeA * d1) / d2;
  const payout = stakeA * d1; // approx equalized
  const totalStake = stakeA + stakeB;
  const profit = payout - totalStake;

  return {
    stakeA: Number(stakeA.toFixed(2)),
    stakeB: Number(stakeB.toFixed(2)),
    payout: Number(payout.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    roi: Number(((profit/totalStake)*100).toFixed(2))
  };
};

// 🎯 Auto bet suggestion score (uses your backend fields)
const suggestionScore = (g) => {
  let s = 0;
  s += (g.ev || 0) * 2;
  if (g.steam) s += 10;
  if (g.steamStrength === "strong") s += 10;
  if (g.arb) s += 20;
  if (g.confidence) s += g.confidence / 5;
  return s;
};

export default function Dashboard() {

/* ================= STATE ================= */
const [games, setGames] = useState([]);
const [activeTab, setActiveTab] = useState("NBA");
const [betSlip, setBetSlip] = useState([]);
const [stake, setStake] = useState(100);
const [lastOdds, setLastOdds] = useState({});
const [ticker, setTicker] = useState("");
const [tickSound, setTickSound] = useState(null);

const [historyMap, setHistoryMap] = useState({});
const [steamAlerts, setSteamAlerts] = useState([]);
const [notifications, setNotifications] = useState([]);
const [permission, setPermission] = useState("default");

// hedge panel state
const [hedgeGame, setHedgeGame] = useState(null);
const [hedgeStake, setHedgeStake] = useState(100);

/* ================= INIT ================= */
useEffect(() => {
  fetchAll();
  const interval = setInterval(fetchAll, 6000);
  return () => clearInterval(interval);
}, [activeTab]);

useEffect(() => {
  const tick = new Audio("/tick.mp3");
  tick.volume = 0.25;
  setTickSound(tick);

  // ask for browser notifications once
  if ("Notification" in window) {
    Notification.requestPermission().then(p => setPermission(p));
  }
}, []);

/* ================= FETCH ================= */
const fetchAll = async () => {
  await Promise.all([fetchGames(), fetchSteam()]);
};

const fetchGames = async () => {
  const sportMap = {
    NBA: "basketball_nba",
    NFL: "americanfootball_nfl",
    PROPS: "basketball_nba"
  };

  const res = await fetch(`${API}/api/data?sport=${sportMap[activeTab]}`);
  const data = await res.json();

  let tickerText = "";

  const updated = (data.games || []).map(g => {
    const prev = lastOdds[g.id] ?? g.homeOdds;
    const move = (g.homeOdds ?? 0) - prev;

    // 🔊 sound on meaningful move
    if (Math.abs(move) >= 5 && tickSound) {
      tickSound.currentTime = 0;
      tickSound.play().catch(()=>{});
    }

    // 🔔 create in-app + browser notification on strong signals
    if (Math.abs(move) >= 5 || g.steamStrength === "strong" || g.arb) {
      const msg = `${g.away} @ ${g.home} | move ${move} | ${g.arb ? "ARB" : g.steamStrength || ""}`;
      pushNotification(msg);
    }

    tickerText += `${g.home} ${g.homeOdds} | `;
    return { ...g, move };
  });

  setTicker(tickerText);
  setGames(updated);

  setLastOdds(prev => {
    const copy = { ...prev };
    updated.forEach(g => (copy[g.id] = g.homeOdds));
    return copy;
  });

  // 📈 history for top games
  updated.slice(0,5).forEach(async g => {
    if (!historyMap[g.id]) {
      const h = await fetch(`${API}/api/history/${g.id}`);
      const json = await h.json();
      setHistoryMap(prev => ({ ...prev, [g.id]: json }));
    }
  });
};

const fetchSteam = async () => {
  try {
    const res = await fetch(`${API}/api/steam`);
    const data = await res.json();
    setSteamAlerts(data || []);
  } catch {}
};

/* ================= NOTIFICATIONS ================= */
const pushNotification = (text) => {
  setNotifications(prev => {
    // avoid spam duplicates in short window
    if (prev[0]?.text === text) return prev;
    return [{ id: Date.now(), text }, ...prev].slice(0, 20);
  });

  if ("Notification" in window && permission === "granted") {
    try { new Notification("KBETZ Alert", { body: text }); } catch {}
  }
};

/* ================= AI / SUGGESTIONS ================= */
const aiPicks = useMemo(() => {
  return [...games]
    .sort((a,b)=>(b.confidence||0)-(a.confidence||0))
    .slice(0,3);
}, [games]);

const autoSuggestions = useMemo(() => {
  return [...games]
    .sort((a,b)=>suggestionScore(b)-suggestionScore(a))
    .slice(0,5);
}, [games]);

const buildParlay = () => setBetSlip(aiPicks);

/* ================= BET ================= */
const addToSlip = (g, odds, book="AI") => {
  setBetSlip([...betSlip, { ...g, odds, book }]);
};

const payout = () => {
  const odds = betSlip.reduce((a,b)=>a*toDecimal(b.homeOdds||-110),1);
  return (stake * odds).toFixed(2);
};

/* ================= UI ================= */
return (
<div style={styles.page}>

  {/* TICKER */}
  <div style={styles.ticker}>
    <div style={styles.tickerMove}>{ticker}</div>
  </div>

  <h1 style={styles.logo}>KBETZ TERMINAL</h1>

  {/* TABS */}
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

  {/* 🔔 NOTIFICATIONS PANEL */}
  <div style={styles.card}>
    <h3>🔔 Notifications</h3>
    {notifications.length === 0 && <div style={styles.sub}>No alerts yet</div>}
    {notifications.map(n=>(
      <div key={n.id} style={styles.alert}>{n.text}</div>
    ))}
  </div>

  {/* 🔥 STEAM ALERTS */}
  <div style={styles.card}>
    <h3>🔥 Steam Alerts</h3>
    {steamAlerts.map((s,i)=>(
      <div key={i} style={styles.alert}>
        Game: {s.gameId} | Move: {s.move} ({s.strength})
      </div>
    ))}
  </div>

  {/* 🧠 AI PICKS */}
  <div style={styles.card}>
    <h3>🧠 AI Picks</h3>
    {aiPicks.map(p=>(
      <div key={p.id} style={styles.row}>
        {p.away} @ {p.home}
        <span style={styles.green}>{p.confidence || 70}%</span>
      </div>
    ))}
    <button style={styles.btn} onClick={buildParlay}>
      Build AI Parlay
    </button>
  </div>

  {/* 🎯 AUTO SUGGESTIONS */}
  <div style={styles.card}>
    <h3>🎯 Auto Bet Suggestions</h3>
    {autoSuggestions.map(g=>(
      <div key={g.id} style={styles.row}>
        <div>{g.away} @ {g.home}</div>
        <div style={styles.sub}>EV {Number(g.ev||0).toFixed(2)}%</div>
        <button style={styles.smallBtn} onClick={()=>addToSlip(g, g.homeOdds, "AUTO")}>
          Add
        </button>
      </div>
    ))}
  </div>

  {/* 📈 MARKETS + CHARTS */}
  <div style={styles.market}>
    <div style={styles.header}>
      <span>Game</span>
      <span>DK</span>
      <span>FD</span>
      <span>Best</span>
      <span>Hedge</span>
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

            {/* 📈 CHART */}
            <div style={{height:50}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyMap[g.id] || []}>
                  <Line dataKey="odds" stroke="#00ff99" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
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

          {/* 🛡 Hedge trigger */}
          <button
            style={styles.smallBtn}
            onClick={()=>setHedgeGame(g)}
          >
            Hedge
          </button>

        </div>
      );
    })}
  </div>

  {/* 🛡 HEDGE ENGINE PANEL */}
  {hedgeGame && (
    <div style={styles.hedgePanel}>
      <h3>🛡 Hedge Engine</h3>

      <div>{hedgeGame.away} @ {hedgeGame.home}</div>

      <input
        value={hedgeStake}
        onChange={e=>setHedgeStake(Number(e.target.value))}
        style={styles.input}
      />

      {(() => {
        const dk = hedgeGame.books?.[0];
        const fd = hedgeGame.books?.[1];
        if (!dk || !fd) return <div style={styles.sub}>Need 2 books</div>;

        const h = calcHedge(dk.home, fd.away, hedgeStake);
        return (
          <div style={{marginTop:10}}>
            <div>Bet A: ${h.stakeA}</div>
            <div>Bet B: ${h.stakeB}</div>
            <div style={styles.green}>Profit: ${h.profit} ({h.roi}%)</div>
          </div>
        );
      })()}

      <button style={styles.btn} onClick={()=>setHedgeGame(null)}>
        Close
      </button>
    </div>
  )}

  {/* 💰 BET SLIP */}
  <div style={styles.slip}>
    <h3>Bet Slip</h3>

    {betSlip.map((b,i)=>(
      <div key={i}>{b.home} ({b.book})</div>
    ))}

    <input
      value={stake}
      onChange={e=>setStake(Number(e.target.value))}
      style={styles.input}
    />

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

ticker:{overflow:"hidden",whiteSpace:"nowrap",borderBottom:"1px solid #222",marginBottom:"8px"},
tickerMove:{display:"inline-block",animation:"scroll 25s linear infinite"},

card:{background:"#111",padding:"15px",marginBottom:"10px",borderRadius:"8px"},
alert:{color:"orange",padding:"4px 0"},

market:{background:"#111",borderRadius:"8px"},
header:{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"10px",borderBottom:"1px solid #222"},
marketRow:{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"10px",borderBottom:"1px solid #222"},

odds:{background:"#1a1a1a",color:"#00ff99",padding:"6px",borderRadius:"6px"},
best:{background:"#1a1a1a",border:"1px solid #00ff99",padding:"6px",borderRadius:"6px"},

row:{display:"flex",justifyContent:"space-between",alignItems:"center"},
green:{color:"#00ff99"},
sub:{color:"#aaa"},

slip:{position:"fixed",right:"20px",top:"120px",width:"260px",background:"#000",padding:"10px",borderRadius:"8px"},
btn:{background:"#00ff99",color:"#000",padding:"8px",border:"none",marginTop:"10px"},
smallBtn:{background:"#222",color:"#fff",padding:"6px",border:"none",borderRadius:"6px"},

hedgePanel:{
position:"fixed",
left:"20px",
top:"120px",
width:"260px",
background:"#000",
padding:"15px",
borderRadius:"8px",
border:"1px solid #00ff99"
},

input:{
width:"100%",
padding:"6px",
marginTop:"10px",
background:"#111",
color:"#fff",
border:"1px solid #333"
}
};