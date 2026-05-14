"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API = process.env.NEXT_PUBLIC_API_URL || "";

  const [games, setGames] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const [email, setEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    if (!email) return alert("Enter email");

    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("email", email);
      setLoggedIn(true);

      // 🔥 ALWAYS SYNC WITH BACKEND
      checkProStatus(email);

      alert("Logged in");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("email");
    setLoggedIn(false);
    setIsPro(false);
    setEmail("");
  };

  /* ================= 🔥 CHECK PRO FROM DB ================= */
  const checkProStatus = async (userEmail) => {
    const res = await fetch(`${API}/api/me?email=${userEmail}`);
    const data = await res.json();
    setIsPro(data.isPro);
  };

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");

    if (!savedEmail) return;

    setEmail(savedEmail);
    setLoggedIn(true);

    checkProStatus(savedEmail);
  }, []);

  /* ================= 🔥 PAYMENT SUCCESS ================= */
  useEffect(() => {
    const url = new URL(window.location.href);
    const emailFromUrl = url.searchParams.get("email");

    if (emailFromUrl) {
      fetch(`${API}/api/upgrade-success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFromUrl }),
      }).then(async () => {
        localStorage.setItem("email", emailFromUrl);
        setLoggedIn(true);

        // 🔥 THIS IS THE REAL FIX
        await checkProStatus(emailFromUrl);

        alert("🔥 PRO Activated!");

        window.history.replaceState({}, "", "/dashboard");
      });
    }
  }, []);

  /* ================= DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API}/api/data`);
      const data = await res.json();

      if (!data || !Array.isArray(data.games)) return;

      setGames(data.games);

      const picks = data.games
        .map((g) => ({
          game: `${g.away} @ ${g.home}`,
          edge: g.edgeScore || 0,
          odds: g.homeOdds || "-110",
        }))
        .sort((a, b) => b.edge - a.edge)
        .slice(0, 3);

      setAiPicks(picks);
    };

    fetchData();
  }, []);

  const addToParlay = (pick) => {
    setParlay((prev) => [...prev, pick]);
  };

  /* ================= UI ================= */
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.logo}>KBETZ TERMINAL</h1>

        <div>
          <span style={styles.live}>● LIVE</span>
          <span style={styles.badge}>
            {isPro ? "PRO" : "FREE"}
          </span>

          {!isPro && loggedIn && (
            <button
              style={styles.upgrade}
              onClick={async () => {
                const res = await fetch(`${API}/api/checkout`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });

                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
            >
              Upgrade
            </button>
          )}

          {loggedIn && (
            <button style={styles.btn} onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* LOGIN */}
      {!loggedIn && (
        <div style={styles.card}>
          <h2>Login / Signup</h2>
          <input
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <button style={styles.smallBtn} onClick={handleLogin}>
            Enter
          </button>
        </div>
      )}

      {/* AI PICKS */}
      <div style={styles.card}>
        <h2>🧠 AI PICKS</h2>

        {!isPro && <p style={{ color: "red" }}>🔒 PRO ONLY</p>}

        {isPro &&
          aiPicks.map((p, i) => (
            <div key={i} style={styles.row}>
              <span>{p.game}</span>
              <span style={{ color: "#00ffcc" }}>
                EV: {p.edge}
              </span>
              <button
                style={styles.smallBtn}
                onClick={() => addToParlay(p)}
              >
                Add
              </button>
            </div>
          ))}
      </div>

      {/* MARKETS */}
      <div style={styles.card}>
        <h2>Markets</h2>
        {games.map((g, i) => (
          <div key={i} style={styles.row}>
            <span>{g.away} @ {g.home}</span>
            <span style={{ color: "#00ffcc" }}>
              {g.homeOdds}
            </span>
          </div>
        ))}
      </div>

      {/* PARLAY */}
      <div style={styles.card}>
        <h2>🔥 AI PARLAY BUILDER</h2>

        {parlay.map((p, i) => (
          <div key={i}>{p.game}</div>
        ))}

        <div style={{ marginTop: "15px" }}>
          <strong>$100.00</strong>
          <br />
          Parlay: {parlay.length} legs
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    background:
      "radial-gradient(circle at 80% 0%, #003c3c, #000 40%, #1a0033 100%)",
    color: "white",
    minHeight: "100vh",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  logo: {
    fontSize: "28px",
    background: "linear-gradient(90deg,#7f00ff,#00ffff)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  card: {
    background: "rgba(10, 0, 25, 0.9)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  input: {
    padding: "8px",
    marginRight: "10px",
    background: "#111",
    color: "#fff",
  },
  btn: { marginLeft: "10px" },
  smallBtn: { marginLeft: "10px" },
  live: { color: "#00ffcc", marginRight: "10px" },
  badge: { background: "#222", padding: "4px 8px" },
  upgrade: { background: "#00ffcc", color: "#000" },
};