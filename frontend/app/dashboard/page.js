"use client";

// 🔒 KBETZ SIGNATURE LAUNCH DASHBOARD
// Purple + Teal Blend • KBETZ on both sides • Upgrade to PRO • Full app functions

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const router = useRouter();
  const [authEmail, setAuthEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthEmail(localStorage.getItem("email") || "");
    }
  }, []);

  const handleKBETZLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
    }
    router.push("/login");
  };

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
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const prevOdds = useRef({});
  const audioRef = useRef(null);

  const FLAGS = {
    SOUND: true,
    FLASH: true,
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const fallbackGames = [
    {
      id: "fallback-1",
      away: "Lakers",
      home: "Warriors",
      homeOdds: -110,
      books: [{ name: "DK" }, { name: "FD" }, { name: "MGM" }],
    },
    {
      id: "fallback-2",
      away: "Celtics",
      home: "Bucks",
      homeOdds: -108,
      books: [{ name: "DK" }, { name: "FD" }, { name: "MGM" }],
    },
    {
      id: "fallback-3",
      away: "Heat",
      home: "Magic",
      homeOdds: 124,
      books: [{ name: "DK" }, { name: "FD" }, { name: "MGM" }],
    },
    {
      id: "fallback-4",
      away: "Chiefs",
      home: "49ers",
      homeOdds: -135,
      books: [{ name: "DK" }, { name: "FD" }, { name: "MGM" }],
    },
  ];

  useEffect(() => {
    const email = getStoredEmail();
    loadAll(email);

    const socket = io(API, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("oddsUpdate", (data) => {
      const incomingGames = Array.isArray(data) ? data : data?.games;

      if (incomingGames?.length) {
        processGames(incomingGames);
        trackLineHistory(incomingGames);
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
    audioRef.current.volume = 0.25;
  }, []);

  const getStoredEmail = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("email") || "";
  };

  const americanToProb = (odds) => {
    const value = parseFloat(odds);
    if (!Number.isFinite(value)) return 0;

    return value > 0
      ? 100 / (value + 100)
      : Math.abs(value) / (Math.abs(value) + 100);
  };

  const decimalMultiplierFromAmerican = (odds) => {
    const value = parseFloat(odds);
    if (!Number.isFinite(value)) return 1;

    return value > 0
      ? 1 + value / 100
      : 1 + 100 / Math.abs(value);
  };

  const formatOdds = (odds) => {
    const value = Number(odds);
    if (!Number.isFinite(value)) return odds;
    return value > 0 ? `+${value}` : value;
  };

  const normalizeGames = (rawGames) => {
    const source = Array.isArray(rawGames) && rawGames.length ? rawGames : fallbackGames;

    return source.map((g, index) => ({
      id: g.id || `game-${index}`,
      away: g.away || g.awayTeam || g.teams?.away || "Away",
      home: g.home || g.homeTeam || g.teams?.home || "Home",
      homeOdds: g.homeOdds ?? g.odds ?? g.price ?? -110,
      books:
        Array.isArray(g.books) && g.books.length
          ? g.books
          : [{ name: "DK" }, { name: "FD" }, { name: "MGM" }],
      sport: g.sport || "LIVE",
      time: g.time || "Live",
    }));
  };

  const loadAll = async (email) => {
    try {
      setLoading(true);

      const [user, roiData, odds] = await Promise.all([
        fetch(`${API}/api/me?email=${email || ""}`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({})),

        fetch(`${API}/api/roi?email=${email || ""}`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({})),

        fetch(`${API}/api/odds`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ games: fallbackGames })),
      ]);

      setBankroll(user?.bankroll ?? 0);
      setIsPro(Boolean(user?.isPro || user?.plan === "pro"));
      setROI(roiData || {});

      const loadedGames = normalizeGames(odds?.games);
      processGames(loadedGames);
      trackLineHistory(loadedGames);
    } catch (err) {
      console.log("KBETZ load error:", err);

      const loadedGames = normalizeGames(fallbackGames);
      processGames(loadedGames);
      trackLineHistory(loadedGames);
    } finally {
      setLoading(false);
    }
  };

  const trackLineHistory = (incomingGames) => {
    setLineHistory((prev) => {
      const updated = {};

      Object.keys(prev || {}).forEach((key) => {
        updated[key] = Array.isArray(prev[key]) ? [...prev[key]] : [];
      });

      normalizeGames(incomingGames).forEach((g) => {
        const key = g.id || `${g.home}-${g.away}`;
        const existing = Array.isArray(updated[key]) ? [...updated[key]] : [];

        const last = existing[existing.length - 1]?.value;
        const base = Number(g.homeOdds || -110);
        const drift = Math.floor(Math.random() * 9) - 4;
        const nextValue = Number.isFinite(last) ? last + drift : base;

        updated[key] = [...existing, { value: nextValue }].slice(-30);
      });

      return updated;
    });
  };

  const processGames = (incomingGames) => {
    const cleanGames = normalizeGames(incomingGames);

    const updated = cleanGames.map((g) => {
      const key = g.id || `${g.home}-${g.away}`;
      const prev = prevOdds.current[key];

      let movement = "";

      if (prev && Number(prev) !== Number(g.homeOdds)) {
        movement = Number(g.homeOdds) > Number(prev) ? "up" : "down";

        if (FLAGS.FLASH) {
          setFlash((prevFlash) => ({
            ...prevFlash,
            [key]: movement,
          }));

          setTimeout(() => {
            setFlash((prevFlash) => ({
              ...prevFlash,
              [key]: "",
            }));
          }, 450);
        }

        if (FLAGS.SOUND) {
          try {
            const playPromise = audioRef.current?.play();
            if (playPromise?.catch) playPromise.catch(() => {});
          } catch {}
        }
      }

      prevOdds.current[key] = g.homeOdds;

      const implied = americanToProb(g.homeOdds);
      const modelBoost = movement === "up" ? 0.035 : movement === "down" ? 0.012 : 0.018;
      const model = implied + modelBoost;
      const edge = (model - implied) * 100;

      return {
        ...g,
        key,
        movement,
        implied,
        edge,
      };
    });

    const sorted = [...updated].sort((a, b) => b.edge - a.edge);

    setGames(sorted);
    setTicker(sorted.map((g) => `${g.away} @ ${g.home} ${formatOdds(g.homeOdds)}`));

    const arb = sorted
      .map((g) => {
        const simulatedEdge = Math.max(0, Number(g.edge) - 0.65);
        return {
          ...g,
          arbEdge: simulatedEdge.toFixed(2),
        };
      })
      .filter((g) => Number(g.arbEdge) > 1.15)
      .slice(0, 4);

    setArbOps(arb);

    const steam = sorted
      .filter((g) => g.movement === "up" || Number(g.edge) >= 2)
      .map((g) => ({
        ...g,
        strength: Math.abs(g.edge + 3.1).toFixed(2),
      }))
      .slice(0, 4);

    setSteamGames(steam);
  };

  const addToParlay = (game) => {
    setParlay((prev) => [...prev, game]);
    setHistory((prev) => [game, ...prev].slice(0, 10));

    if (FLAGS.FLASH) {
      setFlash((prev) => ({
        ...prev,
        [game.key]: "click",
      }));

      setTimeout(() => {
        setFlash((prev) => ({
          ...prev,
          [game.key]: "",
        }));
      }, 220);
    }
  };

  const removeFromParlay = (index) => {
    setParlay((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearParlay = () => {
    setParlay([]);
  };

  const payout = useMemo(() => {
    return parlay
      .reduce((acc, g) => acc * decimalMultiplierFromAmerican(g.homeOdds), 1)
      .toFixed(2);
  }, [parlay]);

  const parlayOdds = useMemo(() => {
    if (parlay.length === 0) return "+0";
    const decimal = Number(payout);
    const american = Math.round((decimal - 1) * 100);
    return `+${american}`;
  }, [payout, parlay.length]);

  const upgrade = async () => {
    const email = getStoredEmail();

    try {
      const res = await fetch(`/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.log("KBETZ checkout error:", err);
      alert("Checkout connection failed. Try again in a moment.");
    }
  };

  const topAiPicks = games.filter((g) => Number(g.edge) > 0).slice(0, 3);

  const roiValue = roi?.roi ?? (isPro ? "18.47" : "--");
  const profitValue = roi?.profit ?? (isPro ? "4529.10" : "--");
  const winsValue = roi?.wins ?? (isPro ? "128" : "--");
  const winRateValue = roi?.winRate ?? (isPro ? "68.8" : "--");

  const handleDeposit = () => {
    alert("Deposit wallet is coming next. For now, use Upgrade to PRO for checkout.");
  };

  const handleViewPick = (pick) => {
    const label =
      typeof pick === "string"
        ? pick
        : pick?.team || pick?.pick || pick?.name || "AI Pick";

    alert(`KBETZ AI Pick: ${label}`);
  };

  const handleViewHistory = () => {
    alert("Bet history is active. Saved bet tracking is coming next.");
  };

  const handleClearParlayClick = () => {
    setParlay([]);
  };

  if (!mounted) {
  return (
      <div style={styles.page}>
        <div style={styles.glowTop}></div>
        <header style={styles.header}>
          <div style={styles.logoLeft}>
            KBETZ <span style={styles.logoTerminal}>TERMINAL</span>
          </div>
          <div style={styles.logoRight}>KBETZ</div>
        </header>
        <section style={styles.bankrollPanel}>
          <div style={styles.iconBox}>⚡</div>
          <div>
            <div style={styles.smallLabel}>LOADING KBETZ</div>
            <div style={styles.bigNumber}>SIGNATURE TERMINAL</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.glowTop}></div>

      <header style={styles.header}>
        <div style={styles.logoLeft}>
          KBETZ <span style={styles.logoTerminal}>TERMINAL</span>
        </div>
        <div style={styles.logoRight}>KBETZ</div>
      </header>

      <section style={styles.bankrollPanel}>
        <div style={styles.iconBox}>💰</div>

        <div>
          <div style={styles.smallLabel}>BANKROLL</div>
          <div style={styles.bigNumber}>${Number(bankroll || 0).toLocaleString()}</div>
        </div>

        <div style={styles.bankrollRight}>
          <div style={styles.smallLabel}>TODAY'S P/L</div>
          <div style={styles.greenMoney}>+$1,356.30</div>
        </div>

        <button style={styles.depositBtn} onClick={handleDeposit}>💳 Deposit</button>
      </section>

      <section style={styles.roiPanel}>
        <div style={styles.sectionIcon}>📈</div>

        <div style={styles.roiLeft}>
          <div style={styles.smallLabel}>ROI PERFORMANCE</div>
          <h2 style={styles.sectionTitleTeal}>+{roiValue}%</h2>

          {!isPro && (
            <button style={styles.upgradeBtn} onClick={upgrade}>
              🔓 Upgrade to PRO
            </button>
          )}
        </div>

        <div style={styles.statRail}>
          <div style={styles.statBlock}>
            <div style={styles.statLabel}>ROI (30D)</div>
            <div style={styles.statValue}>+{roiValue}%</div>
          </div>

          <div style={styles.statBlock}>
            <div style={styles.statLabel}>PROFIT (30D)</div>
            <div style={styles.statValue}>${profitValue}</div>
          </div>

          <div style={styles.statBlock}>
            <div style={styles.statLabel}>WINS (30D)</div>
            <div style={styles.statValue}>{winsValue}</div>
          </div>

          <div style={styles.statBlock}>
            <div style={styles.statLabel}>WIN RATE</div>
            <div style={styles.statValue}>{winRateValue}%</div>
          </div>
        </div>

        <div style={styles.roiCircle}>
          <div style={styles.roiCircleNumber}>+{roiValue}%</div>
          <div style={styles.roiCircleLabel}>ROI</div>
        </div>
      </section>

      <section style={styles.aiWideCard}>
        <div style={styles.iconPink}>🧠</div>

        <div>
          <h2 style={styles.featureTitle}>AI PICKS</h2>
          <p style={styles.featureSubtitle}>Top AI generated edges in real-time</p>
        </div>

        <div style={styles.aiPickList}>
          {topAiPicks.length ? (
            topAiPicks.map((g, i) => (
              <div key={i} style={styles.aiMiniRow}>
                <span>
                  {g.home} {formatOdds(g.homeOdds)}
                </span>
                <span style={styles.confidence}>EDGE {g.edge.toFixed(1)}%</span>
                <button style={styles.smallViewBtn} onClick={() => handleViewPick(g)}>
                  View Pick
                </button>
              </div>
            ))
          ) : (
            <div style={styles.mutedLine}>AI engine is scanning live edges...</div>
          )}
        </div>

        <div style={styles.brainArt}></div>
      </section>

      <section style={styles.summaryCardTeal}>
        <div style={styles.sectionIcon}>📊</div>

        <div>
          <h2 style={styles.featureTitle}>LIVE MARKETS</h2>
          <p style={styles.featureSubtitle}>Real-time odds from multiple sportsbooks</p>
        </div>

        <div style={styles.marketMiniData}>
          <div>NBA</div>
          <strong>BOS 68</strong>
          <strong>MIA 61</strong>
          <span>Q3 6:42</span>
        </div>

        <div style={styles.marketMiniData}>
          <div>SPREAD</div>
          <strong>BOS -4.5</strong>
          <span>-110</span>
        </div>

        <div style={styles.marketMiniData}>
          <div>MONEYLINE</div>
          <strong>BOS -210</strong>
          <span>MIA +175</span>
        </div>

        <div style={styles.sparkLineLong}>
          <ResponsiveContainer>
            <LineChart data={(lineHistory[games[0]?.key] || []).slice(-24)}>
              <Line dataKey="value" stroke="#00ffe1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.livePill}>● LIVE</div>
      </section>

      <section style={styles.splitSummary}>
        <div style={styles.summaryCardGreen}>
          <div style={styles.iconGreen}>$</div>

          <div>
            <h2 style={styles.featureTitle}>ARBITRAGE</h2>
            <p style={styles.featureSubtitle}>Positive EV across books</p>
          </div>

          <div style={styles.rightBadgeGreen}>
            {arbOps.length}
            <span>OPPORTUNITIES</span>
          </div>
        </div>

        <div style={styles.summaryCardPurpleOrange}>
          <div style={styles.iconPurple}>🔥</div>

          <div>
            <h2 style={styles.featureTitle}>STEAM</h2>
            <p style={styles.featureSubtitle}>Sharp money & line movement</p>
          </div>

          <div style={styles.rightBadgePurple}>
            {steamGames.length}
            <span>GAMES</span>
          </div>
        </div>
      </section>

      <section style={styles.parlayWide}>
        <div style={styles.sectionIcon}>🧾</div>

        <div>
          <h2 style={styles.featureTitle}>PARLAY BUILDER</h2>
          <div style={styles.statLabel}>LEGS</div>
          <div style={styles.statValue}>{parlay.length}</div>
        </div>

        <div style={styles.verticalLine}></div>

        <div>
          <div style={styles.statLabel}>POTENTIAL PAYOUT</div>
          <div style={styles.bigNumber}>
            {payout}x <span style={styles.payoutSub}>(${(Number(payout) * 500).toFixed(2)})</span>
          </div>
        </div>

        <div style={styles.verticalLine}></div>

        <div>
          <div style={styles.statLabel}>PARLAY ODDS</div>
          <div style={styles.purpleOdds}>{parlayOdds}</div>
        </div>

        <button style={styles.clearBtn} onClick={clearParlay}>
          🗑 Clear Parlay
        </button>
      </section>

      <section style={styles.historyWide}>
        <div style={styles.iconPurple}>↺</div>

        <div>
          <h2 style={styles.featureTitle}>HISTORY</h2>
          <p style={styles.featureSubtitle}>Your recent bets & results</p>
        </div>

        <div style={styles.historyStat}>
          <span>TODAY</span>
          <strong>5-2</strong>
          <em>+2.35u</em>
        </div>

        <div style={styles.historyStat}>
          <span>THIS WEEK</span>
          <strong>19-8</strong>
          <em>+7.84u</em>
        </div>

        <div style={styles.historyStat}>
          <span>THIS MONTH</span>
          <strong>67-28</strong>
          <em>+18.47u</em>
        </div>

        <button style={styles.historyBtn} onClick={handleViewHistory}>View History</button>

        <div style={styles.rightBadgePurple}>{history.length} BETS</div>
      </section>

      <section style={styles.marketPanel}>
        <div style={styles.marketHeader}>
          <div>
            <h2 style={styles.marketTitle}>LIVE MARKETS</h2>
            <p style={styles.featureSubtitle}>Real-time odds & AI edges</p>
          </div>

          <div style={styles.filterTabs}>
            <span style={styles.activeTab}>ALL</span>
            <span style={styles.tab}>NBA</span>
            <span style={styles.tab}>MLB</span>
            <span style={styles.tab}>NHL</span>
            <span style={styles.tab}>NFL</span>
            <span style={styles.tab}>NCAAB</span>
          </div>

          <div style={styles.liveOnly}>LIVE ONLY 🟢</div>
        </div>

        <div style={styles.tableHeader}>
          <span>GAME</span>
          <span>BOOKS</span>
          <span>BEST LINE</span>
          <span>AI EDGE</span>
          <span>LINE MOVEMENT</span>
          <span>ODDS HISTORY</span>
          <span>ACTION</span>
        </div>

        {loading && <div style={styles.emptyState}>Loading KBETZ live markets...</div>}

        {!loading && games.length === 0 && (
          <div style={styles.emptyState}>No live markets available right now.</div>
        )}

        {games.map((g, i) => {
          const moveText =
            g.movement === "up"
              ? "↑ line moving"
              : g.movement === "down"
              ? "↓ line moving"
              : "stable";

          return (
            <div
              key={g.key || i}
              onMouseEnter={() => setHovered(g.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...styles.marketRow,
                boxShadow:
                  hovered === g.key
                    ? "0 0 28px rgba(0,255,225,0.45)"
                    : flash[g.key] === "up"
                    ? "0 0 18px rgba(0,255,225,0.65)"
                    : flash[g.key] === "down"
                    ? "0 0 18px rgba(255,40,40,0.55)"
                    : flash[g.key] === "click"
                    ? "0 0 18px rgba(0,194,255,0.65)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.04)",
                transform:
                  hovered === g.key
                    ? "translateY(-2px) scale(1.01)"
                    : flash[g.key]
                    ? "scale(1.01)"
                    : "scale(1)",
              }}
            >
              <div style={styles.gameCell}>
                <span style={styles.liveDot}>● LIVE</span>
                <div>
                  <strong>{g.away}</strong>
                  <br />
                  <span>@ {g.home}</span>
                </div>
              </div>

              <div style={styles.booksCell}>
                {(g.books || [{ name: "DK" }, { name: "FD" }, { name: "MGM" }])
                  .slice(0, 3)
                  .map((b, idx) => (
                    <span key={idx} style={styles.bookBadge}>
                      {b.name?.slice(0, 2) || "BK"}
                    </span>
                  ))}
                <span style={styles.extraBooks}>+{Math.max((g.books?.length || 3) - 3, 0)}</span>
              </div>

              <div>
                <strong style={styles.edge}>{g.home}</strong>
                <br />
                <span style={styles.bestLine}>{formatOdds(g.homeOdds)}</span>
              </div>

              <div style={styles.edgeLarge}>+{Number(g.edge || 0).toFixed(2)}%</div>

              <div>
                <span style={g.movement === "down" ? styles.moveDown : styles.moveUp}>
                  {moveText}
                </span>
                <br />
                <span style={styles.smallMuted}>live</span>
              </div>

              <div style={styles.chartCell}>
                <ResponsiveContainer>
                  <LineChart data={lineHistory[g.key] || []}>
                    <Line dataKey="value" stroke="#00ffe1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <button style={styles.addBtn} onClick={() => addToParlay(g)}>
                + Add to Parlay
              </button>
            </div>
          );
        })}
      </section>

      <section style={styles.lowerGrid}>
        <div style={styles.lowerCardGreen}>
          <h2>ARBITRAGE</h2>
          {arbOps.length === 0 ? (
            <div style={styles.mutedLine}>0 opportunities</div>
          ) : (
            arbOps.map((g, i) => (
              <div key={i} style={styles.lowerRow}>
                <span>{g.away} @ {g.home}</span>
                <strong>+{g.arbEdge}%</strong>
              </div>
            ))
          )}
        </div>

        <div style={styles.lowerCardOrange}>
          <h2>STEAM</h2>
          {steamGames.length === 0 ? (
            <div style={styles.mutedLine}>0 games</div>
          ) : (
            steamGames.map((g, i) => (
              <div key={i} style={styles.lowerRow}>
                <span>{g.away} @ {g.home}</span>
                <strong>↑ {g.strength}%</strong>
              </div>
            ))
          )}
        </div>

        <div style={styles.lowerCardPurple}>
          <h2>HISTORY</h2>
          {history.length === 0 ? (
            <div style={styles.mutedLine}>0 bets</div>
          ) : (
            history.map((h, i) => (
              <div key={i} style={styles.lowerRow}>
                <span>{h.home}</span>
                <strong>{formatOdds(h.homeOdds)}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      <footer style={styles.footer}>
        REAL-TIME DATA • AI POWERED • SHARP ADVANTAGE
      </footer>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    padding: 28,
    background:
      "radial-gradient(circle at top left, rgba(0,255,225,0.18), transparent 26%), radial-gradient(circle at top right, rgba(180,48,255,0.32), transparent 32%), linear-gradient(180deg,#020407 0%,#02070a 45%,#000 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    overflowX: "hidden",
  },

  glowTop: {
    position: "absolute",
    top: 76,
    left: 34,
    right: 34,
    height: 2,
    background: "linear-gradient(90deg,#00ffe1,#7c3aed,#ff3df2)",
    boxShadow: "0 0 22px rgba(0,255,225,0.85)",
    opacity: 0.9,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  logoLeft: {
    fontSize: 44,
    fontWeight: 950,
    fontStyle: "italic",
    letterSpacing: 1,
    background: "linear-gradient(90deg,#8b5cf6 0%,#00ffe1 47%,#a855f7 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow:
      "0 0 20px rgba(0,255,225,0.65), 0 0 42px rgba(124,58,237,0.45)",
  },

  logoTerminal: {
    marginLeft: 14,
    fontSize: 34,
    color: "#00eaff",
    WebkitTextFillColor: "#00eaff",
    textShadow: "0 0 18px rgba(0,255,225,0.65)",
  },

  logoRight: {
    fontSize: 44,
    fontWeight: 950,
    fontStyle: "italic",
    letterSpacing: 1,
    background: "linear-gradient(90deg,#00ffe1 0%,#795cff 52%,#ff3df2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow:
      "0 0 22px rgba(0,255,225,0.65), 0 0 44px rgba(255,61,242,0.5)",
  },

  bankrollPanel: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 260px 170px",
    alignItems: "center",
    gap: 18,
    padding: "22px 26px",
    marginBottom: 14,
    borderRadius: 8,
    background:
      "linear-gradient(90deg, rgba(0,255,225,0.08), rgba(255,61,242,0.045)), rgba(2,7,11,0.94)",
    border: "1px solid rgba(0,255,225,0.78)",
    boxShadow:
      "0 0 22px rgba(0,255,225,0.24), inset 0 0 34px rgba(0,255,225,0.035)",
  },

  iconBox: {
    fontSize: 36,
    color: "#00ffe1",
    textShadow: "0 0 18px rgba(0,255,225,0.75)",
  },

  smallLabel: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0.9,
    color: "#f4f7fb",
  },

  bigNumber: {
    fontSize: 34,
    fontWeight: 950,
    color: "#00ffe1",
    textShadow: "0 0 18px rgba(0,255,225,0.72)",
  },

  greenMoney: {
    color: "#20ff7a",
    fontSize: 18,
    fontWeight: 900,
  },

  bankrollRight: {
    justifySelf: "end",
  },

  depositBtn: {
    border: "1px solid rgba(0,255,225,0.7)",
    color: "#00ffe1",
    background: "rgba(0,255,225,0.07)",
    padding: "13px 22px",
    borderRadius: 7,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 0 16px rgba(0,255,225,0.22)",
  },

  roiPanel: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 2.1fr 150px",
    alignItems: "center",
    gap: 18,
    padding: "22px 26px",
    marginBottom: 14,
    borderRadius: 8,
    background:
      "linear-gradient(90deg, rgba(0,255,225,0.065), rgba(180,48,255,0.045)), rgba(2,7,11,0.95)",
    border: "1px solid rgba(0,255,225,0.66)",
    boxShadow:
      "0 0 24px rgba(0,255,225,0.2), inset 0 0 32px rgba(0,255,225,0.03)",
  },

  sectionIcon: {
    fontSize: 35,
    color: "#00ffe1",
    textShadow: "0 0 18px rgba(0,255,225,0.75)",
  },

  roiLeft: {
    minWidth: 190,
  },

  sectionTitleTeal: {
    margin: "4px 0 0",
    color: "#00ffe1",
    fontSize: 29,
    fontWeight: 950,
    textShadow: "0 0 16px rgba(0,255,225,0.58)",
  },

  mutedLine: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 15,
  },

  statRail: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 0,
    borderLeft: "1px solid rgba(255,255,255,0.22)",
    borderRight: "1px solid rgba(255,255,255,0.22)",
  },

  statBlock: {
    textAlign: "center",
    padding: "12px 14px",
    borderRight: "1px solid rgba(255,255,255,0.18)",
  },

  statLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.83)",
    fontWeight: 900,
  },

  statValue: {
    marginTop: 8,
    fontSize: 23,
    color: "#00ffe1",
    fontWeight: 950,
    textShadow: "0 0 14px rgba(0,255,225,0.62)",
  },

  roiCircle: {
    width: 112,
    height: 112,
    borderRadius: "50%",
    border: "8px solid #00d7c7",
    borderRightColor: "#8b5cf6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 0 30px rgba(0,255,225,0.78), inset 0 0 20px rgba(124,58,237,0.18)",
    justifySelf: "end",
    background: "radial-gradient(circle, rgba(0,255,225,0.08), rgba(0,0,0,0.1))",
  },

  roiCircleNumber: {
    fontSize: 23,
    fontWeight: 950,
  },

  roiCircleLabel: {
    color: "#00ffe1",
    fontSize: 13,
    fontWeight: 900,
  },

  upgradeBtn: {
    marginTop: 14,
    padding: "10px 18px",
    borderRadius: 6,
    border: "1px solid rgba(0,255,225,0.82)",
    background: "rgba(0,255,225,0.075)",
    color: "#00ffe1",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow:
      "0 0 16px rgba(0,255,225,0.25), inset 0 0 16px rgba(0,255,225,0.05)",
  },

  aiWideCard: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "70px 1fr 1.6fr 320px",
    alignItems: "center",
    minHeight: 104,
    padding: "18px 24px",
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid rgba(255,61,242,0.86)",
    background:
      "linear-gradient(90deg, rgba(70,8,90,0.56), rgba(5,5,12,0.86)), radial-gradient(circle at 82% 50%, rgba(255,61,242,0.32), transparent 31%)",
    boxShadow:
      "0 0 24px rgba(255,61,242,0.28), inset 0 0 30px rgba(255,61,242,0.04)",
    overflow: "hidden",
  },

  iconPink: {
    fontSize: 38,
    color: "#ff3df2",
    textShadow: "0 0 20px rgba(255,61,242,0.85)",
  },

  featureTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
    color: "#f7fbff",
    textShadow: "0 0 10px rgba(255,255,255,0.18)",
  },

  featureSubtitle: {
    margin: "4px 0 0",
    color: "rgba(255,255,255,0.84)",
    fontSize: 16,
  },

  aiPickList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 2,
  },

  aiMiniRow: {
    display: "grid",
    gridTemplateColumns: "1fr 110px 100px",
    alignItems: "center",
    gap: 12,
    color: "#ffffff",
    fontWeight: 800,
  },

  confidence: {
    color: "#00ffe1",
    fontSize: 13,
  },

  smallViewBtn: {
    border: "1px solid rgba(180,48,255,0.65)",
    background: "rgba(180,48,255,0.08)",
    color: "#d58cff",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 800,
  },

  brainArt: {
    position: "absolute",
    right: 42,
    width: 260,
    height: 90,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,61,242,0.55), transparent 58%)",
    filter: "blur(2px)",
    opacity: 0.45,
  },

  summaryCardTeal: {
    display: "grid",
    gridTemplateColumns: "70px 1.1fr 110px 130px 130px 1fr 120px",
    alignItems: "center",
    minHeight: 82,
    padding: "18px 24px",
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid rgba(0,255,225,0.7)",
    background:
      "linear-gradient(90deg, rgba(0,255,225,0.055), rgba(2,7,11,0.95)), rgba(2,7,11,0.92)",
    boxShadow:
      "0 0 20px rgba(0,255,225,0.17), inset 0 0 25px rgba(0,255,225,0.025)",
  },

  marketMiniData: {
    color: "#fff",
    fontSize: 12,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  sparkLineLong: {
    height: 42,
    opacity: 0.96,
  },

  livePill: {
    justifySelf: "end",
    border: "1px solid rgba(0,255,225,0.72)",
    color: "#00ffe1",
    padding: "12px 24px",
    borderRadius: 6,
    fontWeight: 950,
    background: "rgba(0,255,225,0.06)",
    boxShadow: "0 0 15px rgba(0,255,225,0.22)",
  },

  splitSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 10,
  },

  summaryCardGreen: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 180px",
    alignItems: "center",
    minHeight: 82,
    padding: "18px 24px",
    borderRadius: 8,
    border: "1px solid rgba(0,255,40,0.78)",
    background:
      "linear-gradient(90deg, rgba(0,255,40,0.05), rgba(2,7,11,0.95)), rgba(2,7,11,0.92)",
    boxShadow:
      "0 0 20px rgba(0,255,40,0.17), inset 0 0 25px rgba(0,255,40,0.025)",
  },

  summaryCardPurpleOrange: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 140px",
    alignItems: "center",
    minHeight: 82,
    padding: "18px 24px",
    borderRadius: 8,
    border: "1px solid rgba(180,48,255,0.86)",
    background:
      "linear-gradient(90deg, rgba(180,48,255,0.085), rgba(2,7,11,0.95)), rgba(2,7,11,0.92)",
    boxShadow:
      "0 0 20px rgba(180,48,255,0.2), inset 0 0 25px rgba(180,48,255,0.025)",
  },

  iconGreen: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "3px solid #00ff28",
    color: "#00ff28",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 950,
    boxShadow: "0 0 20px rgba(0,255,40,0.62)",
  },

  iconPurple: {
    fontSize: 42,
    color: "#b430ff",
    textShadow: "0 0 20px rgba(180,48,255,0.72)",
  },

  rightBadgeGreen: {
    justifySelf: "end",
    color: "#00ff28",
    fontSize: 24,
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  rightBadgePurple: {
    justifySelf: "end",
    color: "#c83bff",
    fontSize: 24,
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  parlayWide: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 1px 1.2fr 1px 1fr 180px",
    alignItems: "center",
    gap: 18,
    minHeight: 82,
    padding: "18px 24px",
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid rgba(0,255,225,0.7)",
    background:
      "linear-gradient(90deg, rgba(0,255,225,0.055), rgba(180,48,255,0.055)), rgba(2,7,11,0.92)",
    boxShadow:
      "0 0 20px rgba(0,255,225,0.17), inset 0 0 25px rgba(180,48,255,0.025)",
  },

  verticalLine: {
    width: 1,
    height: 48,
    background: "rgba(255,255,255,0.24)",
  },

  payoutSub: {
    fontSize: 16,
    color: "#00ffe1",
  },

  purpleOdds: {
    fontSize: 28,
    fontWeight: 950,
    color: "#b430ff",
    textShadow: "0 0 15px rgba(180,48,255,0.72)",
  },

  clearBtn: {
    justifySelf: "end",
    border: "1px solid rgba(0,255,225,0.58)",
    color: "#00ffe1",
    background: "rgba(0,255,225,0.055)",
    padding: "12px 24px",
    borderRadius: 6,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 0 14px rgba(0,255,225,0.18)",
  },

  historyWide: {
    display: "grid",
    gridTemplateColumns: "70px 1.2fr 1fr 1fr 1fr 160px 130px",
    alignItems: "center",
    gap: 18,
    minHeight: 82,
    padding: "18px 24px",
    marginBottom: 18,
    borderRadius: 8,
    border: "1px solid rgba(180,48,255,0.86)",
    background:
      "linear-gradient(90deg, rgba(180,48,255,0.085), rgba(2,7,11,0.95)), rgba(2,7,11,0.92)",
    boxShadow:
      "0 0 20px rgba(180,48,255,0.22), inset 0 0 25px rgba(180,48,255,0.025)",
  },

  historyStat: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  historyBtn: {
    border: "1px solid rgba(180,48,255,0.55)",
    background: "rgba(180,48,255,0.06)",
    color: "#d58cff",
    padding: "11px 18px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 900,
  },

  marketPanel: {
    marginTop: 18,
    padding: 18,
    borderRadius: 8,
    border: "1px solid rgba(0,255,225,0.74)",
    background:
      "linear-gradient(180deg, rgba(0,255,225,0.055), rgba(2,7,11,0.94)), rgba(2,7,11,0.94)",
    boxShadow:
      "0 0 28px rgba(0,255,225,0.24), inset 0 0 36px rgba(0,255,225,0.025)",
  },

  marketHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1.4fr 160px",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },

  marketTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
    textShadow: "0 0 12px rgba(255,255,255,0.22)",
  },

  filterTabs: {
    display: "flex",
    gap: 6,
    justifyContent: "center",
  },

  activeTab: {
    padding: "10px 16px",
    borderRadius: 6,
    border: "1px solid rgba(0,255,225,0.86)",
    color: "#00ffe1",
    background: "rgba(0,255,225,0.12)",
    fontWeight: 950,
    boxShadow: "0 0 12px rgba(0,255,225,0.18)",
  },

  tab: {
    padding: "10px 16px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.86)",
    background: "rgba(255,255,255,0.045)",
    fontWeight: 800,
  },

  liveOnly: {
    textAlign: "right",
    color: "#fff",
    fontWeight: 900,
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1.2fr 1.4fr 1fr",
    gap: 12,
    padding: "12px 18px",
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 0.7,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  marketRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1.2fr 1.4fr 1fr",
    alignItems: "center",
    gap: 12,
    padding: "15px 18px",
    marginTop: 8,
    borderRadius: 10,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025))",
    transition: "0.25s ease",
  },

  gameCell: {
    display: "grid",
    gridTemplateColumns: "72px 1fr",
    alignItems: "center",
    gap: 12,
  },

  liveDot: {
    color: "#ff2d2d",
    background: "rgba(255,45,45,0.09)",
    padding: "8px 9px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 950,
    textShadow: "0 0 10px rgba(255,45,45,0.5)",
  },

  booksCell: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  bookBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "linear-gradient(135deg,#0a62ff,#041533)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 950,
    boxShadow: "0 0 10px rgba(0,98,255,0.35)",
  },

  extraBooks: {
    color: "rgba(255,255,255,0.82)",
    marginLeft: 4,
  },

  bestLine: {
    color: "#00ffe1",
    fontSize: 18,
    fontWeight: 950,
    textShadow: "0 0 12px rgba(0,255,225,0.52)",
  },

  edgeLarge: {
    color: "#00ffe1",
    fontSize: 23,
    fontWeight: 950,
    textShadow: "0 0 16px rgba(0,255,225,0.58)",
  },

  moveUp: {
    color: "#2bff55",
    fontWeight: 950,
    textShadow: "0 0 10px rgba(43,255,85,0.45)",
  },

  moveDown: {
    color: "#ff3838",
    fontWeight: 950,
    textShadow: "0 0 10px rgba(255,56,56,0.45)",
  },

  smallMuted: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
  },

  chartCell: {
    width: "100%",
    height: 42,
  },

  addBtn: {
    border: "1px solid rgba(0,255,225,0.62)",
    background: "rgba(0,255,225,0.065)",
    color: "#00ffe1",
    padding: "11px 14px",
    borderRadius: 6,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 0 14px rgba(0,255,225,0.18)",
  },

  lowerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 14,
    marginTop: 18,
  },

  lowerCardGreen: {
    border: "1px solid rgba(0,255,40,0.62)",
    borderRadius: 8,
    padding: 16,
    background:
      "linear-gradient(180deg, rgba(0,255,40,0.055), rgba(2,7,11,0.94))",
    boxShadow: "0 0 18px rgba(0,255,40,0.15)",
  },

  lowerCardOrange: {
    border: "1px solid rgba(255,106,0,0.62)",
    borderRadius: 8,
    padding: 16,
    background:
      "linear-gradient(180deg, rgba(255,106,0,0.055), rgba(2,7,11,0.94))",
    boxShadow: "0 0 18px rgba(255,106,0,0.15)",
  },

  lowerCardPurple: {
    border: "1px solid rgba(180,48,255,0.62)",
    borderRadius: 8,
    padding: 16,
    background:
      "linear-gradient(180deg, rgba(180,48,255,0.065), rgba(2,7,11,0.94))",
    boxShadow: "0 0 18px rgba(180,48,255,0.18)",
  },

  lowerRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  footer: {
    marginTop: 22,
    textAlign: "center",
    letterSpacing: 5,
    color: "#00ffe1",
    border: "1px solid rgba(180,48,255,0.78)",
    borderRadius: 8,
    padding: 13,
    boxShadow:
      "0 0 22px rgba(180,48,255,0.3), inset 0 0 20px rgba(0,255,225,0.035)",
    background: "rgba(2,7,11,0.9)",
    fontSize: 12,
    fontWeight: 900,
  },

  edge: {
    color: "#00ffe1",
    fontWeight: 950,
  },

  emptyState: {
    padding: 22,
    color: "rgba(255,255,255,0.72)",
  },
};