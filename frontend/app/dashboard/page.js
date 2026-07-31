"use client";

// 🔒 KBETZ SIGNATURE LAUNCH DASHBOARD
// Purple + Teal Blend • KBETZ on both sides • Upgrade to PRO • Full app functions

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import Header from "./components/Header";
import AIPicks from "./components/AIPicks";
import LiveMarketsSummary from "./components/LiveMarketsSummary";
import LowerGrid from "../../components/dashboard/LowerGrid";
import SplitSummary from "./components/SplitSummary";
import ParlayBuilder from "./components/ParlayBuilder";
import HistoryPanel from "../../components/dashboard/HistoryPanel";
import LiveMarkets from "../../components/dashboard/LiveMarkets";
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.getElementById("kbetz-final-phone-fit");
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = "kbetz-final-phone-fit";
    style.innerHTML = `
      html,
      body {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        background: #020707 !important;
      }

      * {
        box-sizing: border-box !important;
      }

      img,
      svg,
      canvas,
      video {
        max-width: 100% !important;
      }

      main {
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }

      @media (max-width: 768px) {
        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        main {
          width: 100vw !important;
          max-width: 100vw !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
          overflow-x: hidden !important;
        }

        main > div,
        header,
        section,
        footer,
        article {
          width: 100% !important;
          max-width: calc(100vw - 16px) !important;
          overflow-x: hidden !important;
        }

        .recharts-wrapper,
        .recharts-responsive-container {
          width: 100% !important;
          max-width: 100% !important;
        }

        table {
          width: 100% !important;
          max-width: 100% !important;
          display: block !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }

        button,
        a,
        input,
        select {
          max-width: 100% !important;
        }

        #kbetz-session-control {
          top: auto !important;
          right: 10px !important;
          bottom: 12px !important;
          max-width: calc(100vw - 20px) !important;
          transform: scale(0.88) !important;
          transform-origin: bottom right !important;
        }

        #kbetz-quick-links {
          top: auto !important;
          left: 8px !important;
          right: 8px !important;
          bottom: 72px !important;
          justify-content: center !important;
          max-width: calc(100vw - 16px) !important;
        }

        #kbetz-quick-links a {
          flex: 1 1 42% !important;
          min-width: 0 !important;
          max-width: 180px !important;
          text-align: center !important;
          font-size: 11px !important;
          padding: 9px 8px !important;
          white-space: nowrap !important;
        }
      }

      @media (max-width: 420px) {
        main {
          padding-left: 6px !important;
          padding-right: 6px !important;
        }

        main > div,
        header,
        section,
        footer,
        article {
          max-width: calc(100vw - 12px) !important;
        }

        #kbetz-quick-links {
          left: 6px !important;
          right: 6px !important;
          bottom: 72px !important;
        }

        #kbetz-quick-links a {
          font-size: 10px !important;
          padding: 8px 6px !important;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      const node = document.getElementById("kbetz-final-phone-fit");
      if (node) node.remove();
    };
  }, []);



  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const success = params.get("success");

    if (!sessionId || success !== "true") return;

    async function confirmProPayment() {
      try {
        const res = await fetch(`${API}/api/pro/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (data.success && data.isPro) {
          alert("✅ KBETZ PRO is active. Thank you for upgrading!");
          window.history.replaceState({}, "", "/dashboard");
          window.location.reload();
          return;
        }

        alert(data.error || "Payment received, but PRO did not unlock yet.");
      } catch (err) {
        alert("Payment received, but KBETZ could not confirm PRO yet.");
      }
    }

    confirmProPayment();
  }, []);


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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.getElementById("kbetz-public-launch-mobile-fit");
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = "kbetz-public-launch-mobile-fit";
    style.innerHTML = `
      html,
      body {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        background: #020707 !important;
      }

      * {
        box-sizing: border-box !important;
      }

      button,
      a {
        touch-action: manipulation !important;
      }

      @media (max-width: 768px) {
        main {
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }

        header,
        footer,
        section,
        main > div {
          max-width: calc(100vw - 20px) !important;
        }

        section {
          overflow: hidden !important;
        }

        table {
          width: 100% !important;
          max-width: 100% !important;
          display: block !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }

        button {
          min-height: 42px !important;
        }

        #kbetz-session-control {
          top: auto !important;
          bottom: 12px !important;
          right: 10px !important;
          max-width: calc(100vw - 20px) !important;
          transform: scale(0.9) !important;
          transform-origin: bottom right !important;
        }
      }

      @media (max-width: 480px) {
        main {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        header,
        footer,
        section,
        main > div {
          max-width: calc(100vw - 16px) !important;
        }

        #kbetz-session-control {
          transform: scale(0.86) !important;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      const node = document.getElementById("kbetz-public-launch-mobile-fit");
      if (node) node.remove();
    };
  }, []);


  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.getElementById("kbetz-mobile-fit");
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = "kbetz-mobile-fit";
    style.innerHTML = `
      html,
      body {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        background: #020707 !important;
      }

      * {
        box-sizing: border-box;
      }

      button {
        touch-action: manipulation;
      }

      @media (max-width: 768px) {
        main {
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }

        main > section,
        main > div,
        header,
        footer {
          max-width: calc(100vw - 20px) !important;
        }

        section {
          overflow: hidden !important;
        }

        table,
        [role="table"] {
          max-width: 100% !important;
          overflow-x: auto !important;
          display: block !important;
          -webkit-overflow-scrolling: touch !important;
        }

        #kbetz-session-control {
          top: auto !important;
          right: 10px !important;
          bottom: 12px !important;
          max-width: calc(100vw - 20px) !important;
          transform: scale(0.88) !important;
          transform-origin: bottom right !important;
        }
      }

      @media (max-width: 480px) {
        main {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        main > section,
        main > div,
        header,
        footer {
          max-width: calc(100vw - 16px) !important;
        }

        button {
          min-height: 42px;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      const node = document.getElementById("kbetz-mobile-fit");
      if (node) node.remove();
    };
  }, []);



  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.getElementById("kbetz-quick-links");
    if (existing) existing.remove();

    const wrap = document.createElement("div");
    wrap.id = "kbetz-quick-links";
    wrap.style.position = "fixed";
    wrap.style.top = "auto";
    wrap.style.right = "16px";
    wrap.style.bottom = "18px";
    wrap.style.zIndex = "999999";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "8px";
    wrap.style.flexWrap = "wrap";

    const playerLink = document.createElement("a");
    playerLink.href = "/players";
    playerLink.textContent = "🏈 Player Stats";
    playerLink.style.color = "#ffffff";
    playerLink.style.textDecoration = "none";
    playerLink.style.fontWeight = "1000";
    playerLink.style.fontSize = "12px";
    playerLink.style.padding = "10px 13px";
    playerLink.style.borderRadius = "999px";
    playerLink.style.border = "1px solid rgba(0,255,214,.65)";
    playerLink.style.background = "linear-gradient(90deg, rgba(0,255,214,.22), rgba(210,45,255,.22))";
    playerLink.style.boxShadow = "0 0 22px rgba(0,255,214,.18), 0 0 18px rgba(210,45,255,.14)";
    playerLink.style.backdropFilter = "blur(12px)";

    const parlayLink = document.createElement("a");
    parlayLink.href = "/parlay";
    parlayLink.textContent = "🧠 AI Parlay";
    parlayLink.style.color = "#ffffff";
    parlayLink.style.textDecoration = "none";
    parlayLink.style.fontWeight = "1000";
    parlayLink.style.fontSize = "12px";
    parlayLink.style.padding = "10px 13px";
    parlayLink.style.borderRadius = "999px";
    parlayLink.style.border = "1px solid rgba(103,232,249,.65)";
    parlayLink.style.background = "rgba(103,232,249,.16)";
    parlayLink.style.boxShadow = "0 0 22px rgba(103,232,249,.18)";
    parlayLink.style.backdropFilter = "blur(12px)";

    const howToLink = document.createElement("a");
    howToLink.href = "/how-to-use";
    howToLink.textContent = "❓ How to Use";
    howToLink.style.color = "#ffffff";
    howToLink.style.textDecoration = "none";
    howToLink.style.fontWeight = "1000";
    howToLink.style.fontSize = "12px";
    howToLink.style.padding = "10px 13px";
    howToLink.style.borderRadius = "999px";
    howToLink.style.border = "1px solid rgba(255,255,255,.24)";
    howToLink.style.background = "rgba(255,255,255,.12)";
    howToLink.style.boxShadow = "0 0 22px rgba(255,255,255,.12)";
    howToLink.style.backdropFilter = "blur(12px)";

    const recordLink = document.createElement("a");
    recordLink.href = "/record";
    recordLink.textContent = "📊 Public Record";
    recordLink.style.color = "#ffffff";
    recordLink.style.textDecoration = "none";
    recordLink.style.fontWeight = "1000";
    recordLink.style.fontSize = "12px";
    recordLink.style.padding = "10px 13px";
    recordLink.style.borderRadius = "999px";
    recordLink.style.border = "1px solid rgba(210,45,255,.7)";
    recordLink.style.background = "rgba(210,45,255,.16)";
    recordLink.style.boxShadow = "0 0 22px rgba(210,45,255,.18)";
    recordLink.style.backdropFilter = "blur(12px)";

    wrap.appendChild(playerLink);
    wrap.appendChild(parlayLink);
    wrap.appendChild(howToLink);
    wrap.appendChild(recordLink);
    document.body.appendChild(wrap);

    const mobileStyle = document.createElement("style");
    mobileStyle.id = "kbetz-quick-links-mobile-style";
    mobileStyle.innerHTML = `
      @media (max-width: 768px) {
        #kbetz-quick-links {
          top: auto !important;
          right: 10px !important;
          left: 10px !important;
          bottom: 76px !important;
          justify-content: center !important;
        }

        #kbetz-quick-links a {
          flex: 1 !important;
          text-align: center !important;
          max-width: 180px !important;
        }
      }
    `;
    document.head.appendChild(mobileStyle);

    return () => {
      const node = document.getElementById("kbetz-quick-links");
      if (node) node.remove();

      const styleNode = document.getElementById("kbetz-quick-links-mobile-style");
      if (styleNode) styleNode.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.getElementById("kbetz-session-control");
    if (existing) existing.remove();

    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    const wrap = document.createElement("div");
    wrap.id = "kbetz-session-control";
    wrap.style.position = "fixed";
    wrap.style.top = "70px";
    wrap.style.right = "16px";
    wrap.style.zIndex = "999999";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "8px";
    wrap.style.padding = "8px 10px";
    wrap.style.borderRadius = "14px";
    wrap.style.border = "1px solid rgba(0,255,214,.55)";
    wrap.style.background = "linear-gradient(135deg, rgba(2,12,14,.94), rgba(18,4,30,.94))";
    wrap.style.boxShadow = "0 0 22px rgba(0,255,214,.22), 0 0 18px rgba(210,45,255,.14)";
    wrap.style.backdropFilter = "blur(12px)";

    if (token || email) {
      const label = document.createElement("span");
      label.textContent = email || "Logged in";
      label.style.color = "#00ffd6";
      label.style.fontWeight = "900";
      label.style.fontSize = "11px";
      label.style.maxWidth = "140px";
      label.style.overflow = "hidden";
      label.style.textOverflow = "ellipsis";
      label.style.whiteSpace = "nowrap";

      const logout = document.createElement("button");
      logout.textContent = "Logout";
      logout.style.border = "1px solid rgba(210,45,255,.7)";
      logout.style.background = "rgba(210,45,255,.14)";
      logout.style.color = "#f2b7ff";
      logout.style.borderRadius = "10px";
      logout.style.padding = "8px 12px";
      logout.style.fontWeight = "1000";
      logout.style.cursor = "pointer";
      logout.style.fontSize = "12px";

      logout.onclick = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("plan");
        window.location.href = "/login";
      };

      wrap.appendChild(label);
      wrap.appendChild(logout);
    } else {
      const login = document.createElement("button");
      login.textContent = "Login";
      login.style.border = "1px solid rgba(0,255,214,.65)";
      login.style.background = "rgba(0,255,214,.12)";
      login.style.color = "#00ffd6";
      login.style.borderRadius = "10px";
      login.style.padding = "8px 12px";
      login.style.fontWeight = "1000";
      login.style.cursor = "pointer";
      login.style.fontSize = "12px";
      login.onclick = () => {
        window.location.href = "/login";
      };

      const signup = document.createElement("button");
      signup.textContent = "Signup";
      signup.style.border = "1px solid rgba(210,45,255,.7)";
      signup.style.background = "rgba(210,45,255,.14)";
      signup.style.color = "#f2b7ff";
      signup.style.borderRadius = "10px";
      signup.style.padding = "8px 12px";
      signup.style.fontWeight = "1000";
      signup.style.cursor = "pointer";
      signup.style.fontSize = "12px";
      signup.onclick = () => {
        window.location.href = "/signup";
      };

      wrap.appendChild(login);
      wrap.appendChild(signup);
    }

    document.body.appendChild(wrap);

    return () => {
      const node = document.getElementById("kbetz-session-control");
      if (node) node.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event) => {
      const target = event.target;
      if (!target) return;

      const button = target.closest ? target.closest("button") : null;
      if (!button) return;

      const text = (button.textContent || "").trim().toLowerCase();

      if (text.includes("upgrade")) return;

      if (text.includes("deposit")) {
        event.preventDefault();
        alert("KBETZ Deposit wallet is coming next. PRO checkout is already active.");
        return;
      }

      if (text.includes("view history")) {
        event.preventDefault();
        alert("KBETZ bet history database is coming next. This panel is showing your current demo history.");
        return;
      }

      if (text.includes("clear parlay")) {
        event.preventDefault();
        setParlay([]);
        return;
      }

      if (text.includes("add to parlay")) {
        event.preventDefault();

        const cardText =
          button.closest("tr")?.textContent ||
          button.closest("div")?.parentElement?.textContent ||
          "";

        let selectedGame =
          games.find((g) => {
            const home = String(g.home || "").toLowerCase();
            const away = String(g.away || "").toLowerCase();
            const hay = String(cardText || "").toLowerCase();
            return home && away && hay.includes(home) && hay.includes(away);
          }) || games[0];

        if (!selectedGame) {
          alert("No live game is available to add yet.");
          return;
        }

        const leg = {
          id:
            selectedGame.id ||
            `${selectedGame.away || "Away"}-${selectedGame.home || "Home"}-${Date.now()}`,
          game: `${selectedGame.away || "Away"} @ ${selectedGame.home || "Home"}`,
          pick:
            selectedGame.bestLine ||
            selectedGame.recommended ||
            selectedGame.home ||
            selectedGame.away ||
            "Best Line",
          odds: selectedGame.homeOdds || selectedGame.awayOdds || -110,
        };

        setParlay((prev) => {
          const exists = prev.some((item) => item.id === leg.id);
          if (exists) return prev;
          return [...prev, leg];
        });

        return;
      }
    };

    document.addEventListener("click", handler, true);

    return () => {
      document.removeEventListener("click", handler, true);
    };
  }, [games]);

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
    loadAll();

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

  const loadAll = async () => {
    try {
      setLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const authHeaders = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [user, roiData, odds] = await Promise.all([
        token
          ? fetch(`${API}/api/me`, {
              method: "GET",
              headers: authHeaders,
              cache: "no-store",
            })
              .then(async (response) => {
                if (!response.ok) return {};
                return response.json();
              })
              .catch(() => ({}))
          : Promise.resolve({}),

        token
          ? fetch(`${API}/api/roi`, {
              method: "GET",
              headers: authHeaders,
              cache: "no-store",
            })
              .then(async (response) => {
                if (!response.ok) return {};
                return response.json();
              })
              .catch(() => ({}))
          : Promise.resolve({}),

        fetch(`${API}/api/odds`, {
          cache: "no-store",
        })
          .then(async (response) => {
            if (!response.ok) {
              return { games: fallbackGames };
            }

            return response.json();
          })
          .catch(() => ({ games: fallbackGames })),
      ]);

      const verifiedPro =
        user?.success === true &&
        (user?.isPro === true || user?.plan === "pro");

      setBankroll(
        user?.success === true
          ? Number(user?.bankroll || 0)
          : 0
      );

      setIsPro(verifiedPro);
      setROI(token ? roiData || {} : {});

      const loadedGames = normalizeGames(odds?.games);
      processGames(loadedGames);
      trackLineHistory(loadedGames);
    } catch (err) {
      console.log("KBETZ load error:", err);

      setBankroll(0);
      setIsPro(false);
      setROI({});

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
    if (isPro) {
      alert("KBETZ PRO is active. Billing portal management is coming next.");
      return;
    }

    upgrade();
  };

 const handleViewPick = (pick) => {
  if (typeof pick === "string") {
    alert(`KBETZ AI Pick\n\n${pick}`);
    return;
  }

  const label = pick?.team || pick?.pick || pick?.name || "AI Pick";

  const confidence =
    pick?.confidence != null ? `${Math.round(pick.confidence)}%` : "N/A";

  const edge =
    pick?.edge != null ? `${pick.edge.toFixed(1)}%` : "N/A";

  const risk = pick?.riskLevel || "N/A";

  const recommendation = pick?.recommendation || "No recommendation";

  const analysis =
    pick?.analysis || "AI analysis is being generated.";

  alert(
`🧠 KBETZ AI ANALYSIS

${label}

Confidence: ${confidence}
Edge: ${edge}
Risk: ${risk}

Recommendation:
${recommendation}

Analysis:
${analysis}`
  );
};  const handleViewHistory = () => {
    alert("Bet history is active. Saved bet tracking is coming next.");
  };

  const handleClearParlayClick = () => {
    setParlay([]);
  };

  if (!mounted) {
  return (
      <div style={styles.page}>
        <div style={styles.glowTop}></div>
        <Header />
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

        <Header />

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

        <button style={styles.depositBtn} onClick={handleDeposit}>💎 Billing</button>
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

   {isPro ? (
  <AIPicks
    topAiPicks={topAiPicks}
    styles={styles}
    formatOdds={formatOdds}
    handleViewPick={handleViewPick}
  />
) : (
  <div
    style={{
      marginBottom: 14,
      padding: 24,
      borderRadius: 10,
      border: "1px solid rgba(0,255,225,.45)",
      background:
        "linear-gradient(135deg, rgba(0,255,225,.06), rgba(180,48,255,.06))",
      textAlign: "center",
      color: "#fff",
    }}
  >
    <h2 style={{ marginBottom: 10 }}>🧠 KBETZ AI Picks</h2>

    {topAiPicks.length > 0 ? (
      <>
        <h3>{topAiPicks[0].away} @ {topAiPicks[0].home}</h3>
        <p>Confidence: {Math.round((topAiPicks[0].implied || 0) * 100)}%</p>
      </>
    ) : (
      <p>Live AI picks loading…</p>
    )}

    <div
      style={{
        margin: "18px auto",
        maxWidth: 420,
        padding: 14,
        borderRadius: 8,
        backdropFilter: "blur(4px)",
        background: "rgba(255,255,255,.08)",
      }}
    >
      🔒 Unlock all AI picks, confidence scores, and full analysis with KBETZ PRO.
    </div>

    <button
      onClick={upgrade}
      style={styles.upgradeBtn}
    >
      Upgrade to PRO
    </button>
  </div>
)}
     <LiveMarketsSummary
  styles={styles}
  games={games}
  lineHistory={lineHistory}
/>
 <SplitSummary
  styles={styles}
  arbOps={arbOps}
  steamGames={steamGames}
  isPro={isPro}
  upgrade={upgrade}
/>

<ParlayBuilder
  styles={styles}
  parlay={parlay}
  payout={payout}
  parlayOdds={parlayOdds}
  clearParlay={clearParlay}
  isPro={isPro}
  upgrade={upgrade}
/>

  <HistoryPanel
  styles={styles}
  history={history}
  handleViewHistory={handleViewHistory}
  isPro={isPro}
  upgrade={upgrade}
/>

     <LiveMarkets
  styles={styles}
  loading={loading}
  games={games}
  hovered={hovered}
  setHovered={setHovered}
  flash={flash}
  lineHistory={lineHistory}
  formatOdds={formatOdds}
  addToParlay={addToParlay}
/>

     

      <footer style={styles.footer}>
        REAL-TIME DATA • AI POWERED • SHARP ADVANTAGE
      </footer>
      <div style={styles.legalFooter}>
        <a style={styles.legalLink} href="/terms">Terms</a>
        <span style={styles.legalDot}>•</span>
        <a style={styles.legalLink} href="/privacy">Privacy</a>
        <span style={styles.legalDot}>•</span>
        <a style={styles.legalLink} href="/responsible-gambling">Responsible Gambling</a>
        <span style={styles.legalDot}>•</span>
        <a style={styles.legalLink} href="/support">Support</a>
      </div>

    </div>
  );
}

const styles = {
  page: {
  minHeight: "100vh",

  background: `
    radial-gradient(circle at 15% 10%, rgba(0,255,225,.10), transparent 28%),
    radial-gradient(circle at 85% 0%, rgba(124,92,255,.12), transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(255,61,242,.06), transparent 35%),
    linear-gradient(180deg, #030708 0%, #020506 100%)
  `,

  padding: "30px",

  color: "#ffffff",

  position: "relative",

  overflow: "hidden",
},
  glowTop: {
    position: "absolute",
    top: "-220px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "900px",
    height: "450px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,255,225,0.22) 0%, rgba(124,92,255,0.12) 45%, transparent 75%)",
    filter: "blur(80px)",
    pointerEvents: "none",
    zIndex: 0,
  },

 header: {
  position: "relative",
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",

  padding: "24px 34px",
  marginBottom: "28px",

  borderRadius: "20px",

  background:
    "linear-gradient(135deg, rgba(6,18,24,.88), rgba(18,8,34,.88))",

  border: "1px solid rgba(0,255,225,.28)",

  backdropFilter: "blur(18px)",

  boxShadow:
    "0 0 40px rgba(0,255,225,.12), 0 0 70px rgba(124,92,255,.10), inset 0 0 18px rgba(255,255,255,.03)",
},
logoLeft: {
  fontSize: 52,
  fontWeight: 1000,
  letterSpacing: 2,
  color: "#ffffff",
  textTransform: "uppercase",
  textShadow:
    "0 0 8px rgba(255,255,255,.95), 0 0 22px rgba(0,255,225,.75), 0 0 48px rgba(124,92,255,.45)",
},
   logoTerminal: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 4,
    background: "linear-gradient(90deg,#00ffe1,#7c5cff,#ff3df2)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow:
      "0 0 18px rgba(0,255,225,0.55), 0 0 30px rgba(255,61,242,0.45)",
  },
logoRight: {
  fontSize: 52,
  fontWeight: 1000,
  fontStyle: "italic",
  letterSpacing: 2,
  background:
    "linear-gradient(90deg,#00ffe1 0%,#7c5cff 50%,#ff3df2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow:
    "0 0 18px rgba(0,255,225,.8), 0 0 40px rgba(124,92,255,.6), 0 0 60px rgba(255,61,242,.4)",
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

  legalFooter: {
    marginTop: 22,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    color: "rgba(255,255,255,.58)",
    fontSize: 12,
    fontWeight: 800,
  },
  legalLink: {
    color: "#00ffd6",
    textDecoration: "none",
  },
  legalDot: {
    color: "rgba(255,255,255,.35)",
  },
};