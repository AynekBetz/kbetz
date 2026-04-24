"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await fetch(`${API}/api/health`);

      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server response error");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      if (!data?.token) {
        throw new Error("No token returned");
      }

      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || "Connection failed");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow}></div>

      <div style={styles.card}>
        <div style={styles.live}>● LIVE</div>

        <h1 style={styles.title}>KBETZ</h1>
        <p style={styles.subtitle}>Elite Betting Terminal</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Entering..." : "Enter Dashboard"}
          </button>
        </form>

        {/* ✅ SIGNUP LINK */}
        <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          Don’t have an account?{" "}
          <a href="/signup" style={{ color: "#00ff99" }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    background: "#050505",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: "700px",
    height: "700px",
    background: "radial-gradient(circle, rgba(0,255,150,0.25), transparent)",
    filter: "blur(140px)",
    pointerEvents: "none", // 🔥 FIX CLICK BLOCK
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    width: "340px",
    position: "relative",
    zIndex: 10,
  },
  live: { position: "absolute", top: 10, right: 15, color: "#00ff99" },
  title: { fontSize: 28 },
  subtitle: { fontSize: 12, opacity: 0.7 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: 12, background: "#111", color: "white" },
  error: { color: "red", fontSize: 12 },
  button: {
    padding: 12,
    background: "#00ff99",
    color: "black",
    cursor: "pointer",
  },
};