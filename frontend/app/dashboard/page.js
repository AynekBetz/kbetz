"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

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

  const prevOdds = useRef({});
  const audioRef = useRef(null);

  const FORCE_LIVE = true;

  useEffect(() => {
    const email = localStorage.getItem("email");
    loadAll(email);

    const socket = io(API, { transports: ["websocket"] });
    socket.on("oddsUpdate", processGames);

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
  }, []);

  // ✅ SAFE LIVE SIMULATION (ADDED ONLY)
  useEffect(() => {
    if (!FORCE_LIVE) return;

    const interval = setInterval(() => {
      setGames(prev => {
        const simulated = prev.map(g => {
          const change = Math.random() > 0.5 ? 5 : -5;
          return { ...g, homeOdds: parseFloat(g.homeOdds) + change };
        });

        processGames(simulated);
        return simulated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const americanToProb = (odds) => {
    odds = parseFloat(odds);
    return odds > 0
      ? 100 / (odds + 100)
      : Math.abs(odds) / (Math.abs(odds) + 100);
  };

  const loadAll = async (email) => {
    const user = await fetch(`${API}/api/me?email=${email}`).then(r=>r.json());
    const roiData = await fetch(`${API}/api/roi?email=${email}`).then(r=>r.json());
    const odds = await fetch(`${API}/api/odds`).then(r=>r.json());

    setBankroll(user?.bankroll || 0);
    setIsPro(user?.isPro || false);
    setROI(roiData);

    processGames(odds?.games || []);
  };

  const processGames = (games) => {
    const updated = games.map(g => {
      const key = g.id || `${g.home}-${g.away}`;
      const prev = prevOdds.current[key];

      let movement = "";
      if (prev && prev !== g.homeOdds) {
        movement = g.homeOdds > prev ? "up" : "down";

        setFlash(prev => ({ ...prev, [key]: movement }));
        setTimeout(() => {
          setFlash(prev => ({ ...prev, [key]: "" }));
        }, 800);

        audioRef.current?.play();
      }

      prevOdds.current[key] = g.homeOdds;

      const implied = americanToProb(g.homeOdds);
      const model = movement === "up" ? implied + 0.04 : implied - 0.02;
      const edge = ((model - implied) * 100);

      return { ...g, movement, edge, key, implied };
    });

    const sorted = [...updated].sort((a,b)=>b.edge - a.edge);

    setGames(sorted);
    setTicker(sorted.map(g => `${g.away} @ ${g.home} (${g.homeOdds})`));

    const arb = sorted.filter(g => {
      if (!g.books || g.books.length < 2) return false;

      const probs = g.books.map(b => americanToProb(b.odds));
      const total = probs.reduce((a,b)=>a+b,0);

      g.arbEdge = ((1 - total) * 100).toFixed(2);
      return total < 1;
    });

    setArbOps(arb.slice(0,3));

    const steam = sorted.filter(g => g.movement === "up").map(g => ({
      ...g,
      strength: Math.abs(g.edge).toFixed(2)
    }));

    setSteamGames(steam.slice(0,3));
  };

  const addToParlay = (g) => {
    setParlay(prev => [...prev, g]);
    setHistory(prev => [...prev, g].slice(-10));

    setFlash(prev => ({ ...prev, [g.key]: "click" }));
    setTimeout(()=>setFlash(prev => ({ ...prev, [g.key]: "" })),300);
  };

  const removeFromParlay = (i) => {
    setParlay(prev => prev.filter((_, idx) => idx !== i));
  };

  const payout = parlay.reduce((acc, g) => {
    const o = parseFloat(g.homeOdds);
    return acc * (1 + o / 100);
  }, 1).toFixed(2);

  return (
    <div style={styles.page}>

      <h1 style={styles.logo}>KBETZ TERMINAL</h1>
      <div style={styles.bar} />
      <div style={styles.ticker}>{ticker.join(" • ")}</div>
      <div style={styles.bankrollCard}>💰 ${bankroll}</div>

      <div style={styles.grid}>

        {/* LEFT */}
        <div>

          <div style={styles.cardGlow}>
            <h2>ROI</h2>
            <div>
              <div>ROI: {roi?.roi || "--"}%</div>
              <div>Profit: ${roi?.profit || "--"}</div>
            </div>
          </div>

          <div style={styles.aiCard}>
            <h2>AI SIGNALS</h2>
            {games.filter(g => g.edge > 2).slice(0,3).map((g,i)=>(
              <div key={i} style={styles.row}>
                {g.away} @ {g.home}
                <span style={styles.edge}>+{g.edge.toFixed(2)}%</span>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT */}
        <div>

          <div style={styles.cardGlow}>
            <h2>BETSLIP</h2>

            {parlay.map((p,i)=>(
              <div key={i} style={styles.row}>
                {p.home}
                <button onClick={()=>removeFromParlay(i)}>❌</button>
              </div>
            ))}

            <div style={styles.payout}>{payout}x</div>
          </div>

        </div>

      </div>

      {/* MARKETS */}
      <div style={styles.cardGlow}>
        <h2>LIVE MARKETS</h2>

        {games.map((g,i)=>(
          <div
            key={i}
            style={{
              ...styles.marketRow,
              boxShadow:
                flash[g.key] === "up"
                  ? "0 0 15px #00ffe1"
                  : flash[g.key] === "down"
                  ? "0 0 15px red"
                  : flash[g.key] === "click"
                  ? "0 0 15px #00c2ff"
                  : "none",
              transform: flash[g.key] ? "scale(1.02)" : "scale(1)"
            }}
          >
            <div>
              {g.away} @ {g.home}
              <span style={{marginLeft:10,color:"#00ffe1"}}>
                +{g.edge.toFixed(2)}%
              </span>
            </div>

            <button style={styles.odds} onClick={()=>addToParlay(g)}>
              {g.homeOdds}
            </button>
          </div>
        ))}
      </div>

      {/* ARB */}
      <div style={styles.cardGlow}>
        <h2>ARBITRAGE</h2>
        {arbOps.map((g,i)=>(
          <div key={i}>{g.home} +{g.arbEdge}%</div>
        ))}
      </div>

      {/* STEAM */}
      <div style={styles.cardGlow}>
        <h2>STEAM</h2>
        {steamGames.map((g,i)=>(
          <div key={i}>{g.home} ↑ {g.strength}%</div>
        ))}
      </div>

      {/* HISTORY */}
      <div style={styles.cardGlow}>
        <h2>HISTORY</h2>
        {history.map((h,i)=>(
          <div key={i}>{h.home}</div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  page:{padding:20,background:"#000",color:"#fff"},
  logo:{fontSize:32,color:"#00ffe1"},
  bar:{height:2,background:"#00ffe1",marginBottom:10},
  ticker:{marginBottom:10},
  grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:15},
  cardGlow:{padding:15,marginTop:15},
  aiCard:{padding:15,marginTop:15},
  row:{display:"flex",justifyContent:"space-between"},
  marketRow:{display:"flex",justifyContent:"space-between",marginBottom:10},
  odds:{background:"#00ffe1",color:"#000",border:"none",padding:"6px 10px"},
  edge:{color:"#00ffe1"},
  payout:{marginTop:10},
  bankrollCard:{marginBottom:10}
};