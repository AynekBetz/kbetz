"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const API = "https://kbetz-main.onrender.com";

  const [games, setGames] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [parlay, setParlay] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const [email, setEmail] = useState("");

  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    if (!email) return alert("Enter email");

    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("email", email);
      setIsPro(data.isPro);
      alert("Logged in");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("email");
    setIsPro(false);
    setEmail("");
    window.location.href = "/auth";
  };

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");

    if (!savedEmail) return;

    setEmail(savedEmail);

    fetch(`${API}/api/me?email=${savedEmail}`)
      .then((res) => res.json())
      .then((data) => {
        setIsPro(data.isPro);
      });
  }, []);

  /* ================= 🔥 FIXED PAYMENT SUCCESS ================= */
  useEffect(() => {
    const url = new URL(window.location.href);
    const emailFromUrl = url.searchParams.get("email");

    if (emailFromUrl) {
      fetch(`${API}/api/upgrade-success`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailFromUrl }),
      }).then(async () => {
        localStorage.setItem("email", emailFromUrl);

        // 🔥 RECHECK FROM BACKEND (IMPORTANT)
        const res = await fetch(`${API}/api/me?email=${emailFromUrl}`);
        const data = await res.json();

        setIsPro(data.isPro);

        alert("🔥 PRO Activated!");

        window.history.replaceState({}, "", "/dashboard");
      });
    }
  }, []);

  /* ================= DATA ================= */
  useEffect(() => {
    fetch(`${API}/api/data`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.games) return;

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
      });
  }, []);

  const addToParlay = (pick) => {
    setParlay((prev) => [...prev, pick]);
  };

  const upgrade = async () => {
    const email = localStorage.getItem("email");

    if (!email) return alert("Login first");

    const res = await fetch(`${API}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.url) window.location.href = data.url;
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

          {!isPro && (
            <button style={styles.upgrade} onClick={upgrade}>
              Upgrade
            </button>
          )}

          <button style={styles.btn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {!localStorage.getItem("email") && (
        <div style={styles.card}>
          <h2>Login</h2>
          <input
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleLogin}>Enter</button>
        </div>
      )}

      <div style={styles.card}>
        <h2>🧠 AI PICKS</h2>
        {!isPro ? <p>🔒 PRO ONLY</p> : aiPicks.map((p, i) => (
          <div key={i}>{p.game} (EV {p.edge})</div>
        ))}
      </div>

      <div style={styles.card}>
        <h2>Games</h2>
        {games.map((g, i) => (
          <div key={i}>
            {g.away} @ {g.home}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 20, color: "white", background: "#000" },
  header: { display: "flex", justifyContent: "space-between" },
  logo: { fontSize: 24 },
  card: { marginTop: 20, padding: 20, background: "#111" },
  badge: { marginLeft: 10 },
  live: { color: "#00ffcc" },
  upgrade: { marginLeft: 10 },
  btn: { marginLeft: 10 },
  input: { padding: 8 },
};