"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function Dashboard() {
  const API = "https://kbetz-main.onrender.com";

  const [games, setGames] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [roi, setROI] = useState(null);
  const [bets, setBets] = useState([]);
  const [bankroll, setBankroll] = useState(0);
  const [isPro, setIsPro] = useState(false);

  const [ticker, setTicker] = useState([]);
  const [arbOps, setArbOps] = useState([]);
  const [steamGames, setSteamGames] = useState([]);

  const prevOdds = useRef({});
  const history = useRef({});
  const audioRef = useRef(null);

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    loadAll();

    const interval = setInterval(loadAll, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
  }, []);

  useEffect(() => {
    const socket = io(API);

    socket.on("oddsUpdate", (games) => {
      processGames(games);
    });

    return () => socket.disconnect();
  }, []);

  const loadAll = async () => {
    const email = localStorage.getItem("email");

    try {
      const odds = await fetch(`${API}/api/odds`).then(r => r.json());
      const roiData = await fetch(`${API}/api/roi?email=${email}`).then(r => r.json());
      const betData = await fetch(`${API}/api/bets?email=${email}`).then(r => r.json());
      const userData = await fetch(`${API}/api/me?email=${email}`).then(r => r.json());

      setROI(roiData || {});
      setBets(betData || []);
      setBankroll(userData?.bankroll || 0);
      setIsPro(userData?.isPro || false);

      processGames(odds?.games || []);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  const americanToProb = (odds) => {
    odds = parseFloat(odds);
    return odds > 0
      ? 100 / (odds + 100)
      : Math.abs(odds) / (Math.abs(odds) + 100);
  };

  const calculateAI = (g) => {
    const implied = americanToProb(g.homeOdds);

    let model = implied;
    let score = 0;

    if (g.movement === "up") { model += 0.05; score += 2; }
    if (g.movement === "down") { model -= 0.04; score -= 1; }

    const hist = history.current[g.key] || [];
    if (hist.length >= 3 && Math.abs(hist.at(-1) - hist[0]) > 8) {
      model += 0.05;
      score += 3;
    }

    const ev = (model - implied) * 100;

    return {
      edge: ev.toFixed(2),
      confidence: Math.min(95, 60 + score * 5),
      isEV: ev > 2.5,
    };
  };

  const kellyStake = (edge, odds) => {
    const prob = edge / 100;
    const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
    const kelly = (prob * (b + 1) - 1) / b;
    return Math.max(0, (kelly * bankroll).toFixed(2));
  };

  const findArb = (games) => {
    const ops = [];

    games.forEach(g => {
      if (!g.books || g.books.length < 2) return;

      const decimals = g.books.map(b => {
        const o = parseFloat(b.odds);
        return o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o);
      });

      const inv = decimals.reduce((a, d) => a + 1 / d, 0);

      if (inv < 1) {
        ops.push({
          game: `${g.away} @ ${g.home}`,
          profit: ((1 - inv) * 100).toFixed(2),
        });
      }
    });

    setArbOps(ops);
  };

  const detectSteam = (games) => {
    const steam = games.filter(g => {
      const hist = history.current[g.key] || [];
      return hist.length >= 3 && Math.abs(hist.at(-1) - hist[0]) > 10;
    });

    setSteamGames(steam);
  };

  const processGames = (games) => {
    const updated = games.map(g => {
      const key = g.id || `${g.home}-${g.away}-${g.homeOdds}`;

      const prev = prevOdds.current[key];
      let movement = "";

      if (prev && prev !== g.homeOdds) {
        movement = g.homeOdds > prev ? "up" : "down";

        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      }

      prevOdds.current[key] = g.homeOdds;

      if (!history.current[key]) history.current[key] = [];
      history.current[key].push(parseFloat(g.homeOdds));
      if (history.current[key].length > 10) history.current[key].shift();

      const ai = calculateAI({ ...g, movement, key });

      return { ...g, key, movement, history: history.current[key], ...ai };
    });

    setGames(updated);

    setTicker(updated.map(g => `${g.away} @ ${g.home} (${g.homeOdds})`));
    findArb(updated);
    detectSteam(updated);

    const picks = updated
      .filter(g => g.isEV)
      .sort((a, b) => b.edge - a.edge)
      .slice(0, 3);

    setAiPicks(picks);
  };

  const addToParlay = (g) => setParlay(prev => [...prev, g]);
  const clearParlay = () => setParlay([]);

  const payout = parlay.reduce((acc, g) => {
    const odds = parseFloat(g.homeOdds);
    return acc * (1 + odds / 100);
  }, 1).toFixed(2);

  const upgrade = async () => {
    const email = localStorage.getItem("email");

    try {
      const res = await fetch(`${API}/api/checkout`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.log("Upgrade error:", err);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.ticker}>{ticker.join(" • ")}</div>

      <h1 style={styles.logo}>KBETZ TERMINAL</h1>

      <div style={styles.cardGlow}>💰 ${bankroll}</div>

      <div style={styles.cardGlow}>
        <h2>ROI</h2>
        <div style={!isPro ? styles.blur : {}}>
          ROI: {roi?.roi}% | Profit: ${roi?.profit}
        </div>
        {!isPro && (
          <button style={styles.upgradeBtn} onClick={upgrade}>
            🔓 Upgrade to PRO
          </button>
        )}
      </div>

      <div style={styles.aiCard}>
        <h2>🧠 AI PICKS</h2>
        <div style={!isPro ? styles.blur : {}}>
          {aiPicks.map((g, i) => (
            <div key={i} style={styles.row}>
              <div>{g.away} @ {g.home}</div>
              <div style={styles.edge}>
                +{g.edge}%<br />
                {g.confidence}%<br />
                <small>Kelly: ${kellyStake(g.edge, g.homeOdds)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.cardGlow}>
        <h2>📊 LIVE MARKETS</h2>
        {games.map((g, i) => (
          <div key={i}
            style={{
              ...styles.row,
              transition: "0.3s",
              transform:
                g.movement === "up" ? "scale(1.03)" :
                g.movement === "down" ? "scale(0.97)" : "scale(1)",
              boxShadow:
                g.movement === "up"
                  ? "0 0 12px rgba(0,255,200,0.6)"
                  : g.movement === "down"
                  ? "0 0 12px rgba(255,0,0,0.6)"
                  : "none"
            }}>
            <div>
              {g.away} @ {g.home}
              {arbOps.find(a => a.game.includes(g.home)) && " 🟢"}
              {steamGames.find(s => s.home === g.home) && " 🔥"}
            </div>

            <button style={styles.button} onClick={() => addToParlay(g)}>Add</button>
          </div>
        ))}
      </div>

      <div style={styles.cardGlow}>
        <h2>🟢 Arbitrage</h2>
        {arbOps.map((a,i)=>(<div key={i}>{a.game} +{a.profit}%</div>))}
      </div>

      <div style={styles.cardGlow}>
        <h2>🔥 Steam</h2>
        {steamGames.map((g,i)=>(<div key={i}>{g.away} @ {g.home}</div>))}
      </div>

      <div style={styles.cardGlow}>
        <h2>🔥 PARLAY</h2>
        {parlay.map((p, i) => (
          <div key={i}>{p.away} @ {p.home}</div>
        ))}
        <p>Legs: {parlay.length}</p>
        <p>Payout: {payout}x</p>
        <button style={styles.button} onClick={clearParlay}>Clear</button>
      </div>

      <div style={styles.cardGlow}>
        <h2>📜 HISTORY</h2>
        {bets.map((b, i) => (
          <div key={i}>{b.game} - {b.result}</div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  page:{padding:20,background:"radial-gradient(circle at top,#003c3c,#000)",color:"#fff"},
  ticker:{color:"#00ffcc"},
  logo:{color:"#00ffcc"},
  cardGlow:{background:"#111",padding:15,marginTop:15},
  aiCard:{background:"#4c1d95",padding:15,marginTop:15},
  row:{display:"flex",justifyContent:"space-between"},
  edge:{color:"#00ffcc"},
  button:{background:"#00ffcc",border:"none",padding:"5px 10px"},
  blur:{filter:"blur(6px)"},
  upgradeBtn:{background:"#00ffcc",padding:"8px"}
};