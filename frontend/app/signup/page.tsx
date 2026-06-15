"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getToken = (data: any) =>
    data?.token || data?.accessToken || data?.jwt || data?.user?.token || "";

  const handleSignup = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const signupRes = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const signupData = await signupRes.json();
      let token = getToken(signupData);

      if (!signupRes.ok) {
        setMessage(signupData?.error || signupData?.message || "Signup failed.");
        return;
      }

      if (!token) {
        const loginRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          setMessage(loginData?.error || loginData?.message || "Signup worked, but login failed.");
          return;
        }

        token = getToken(loginData);
      }

      if (!token) {
        token = `kbetz-local-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("email", email.trim().toLowerCase());

      router.push("/dashboard");
    } catch {
      setMessage("Connection failed. Try again in a moment.");
    } finally {
      setLoading(false);
    }
};

  return (
    <main style={styles.page}>
      <div style={styles.glowA}></div>
      <div style={styles.glowB}></div>

      <section style={styles.card}>
        <div style={styles.live}>● LIVE</div>

        <h1 style={styles.logo}>KBETZ</h1>
        <p style={styles.kicker}>AI BETTING TERMINAL</p>

        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Open your KBETZ dashboard and start tracking AI edges.</p>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSignup();
          }}
        />

        {message ? <p style={styles.message}>{message}</p> : null}

        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <button style={styles.secondary} onClick={() => router.push("/login")}>
          Already have an account? Login
        </button>

      <div style={styles.legalFooter}>
        <a style={styles.legalLink} href="/terms">Terms</a>
        <span style={styles.legalDot}>•</span>
        <a style={styles.legalLink} href="/privacy">Privacy</a>
        <span style={styles.legalDot}>•</span>
        <a style={styles.legalLink} href="/responsible-gambling">Responsible Gambling</a>
        <span style={styles.legalDot}>•</span>
        <a style={styles.legalLink} href="/support">Support</a>
      </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 18% 20%, rgba(0,255,214,.18), transparent 30%), radial-gradient(circle at 86% 18%, rgba(210,45,255,.24), transparent 30%), linear-gradient(135deg, #020707, #041313 42%, #090212)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  glowA: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 999,
    background: "rgba(0,255,214,.15)",
    filter: "blur(90px)",
    left: -130,
    top: 60,
  },
  glowB: {
    position: "absolute",
    width: 440,
    height: 440,
    borderRadius: 999,
    background: "rgba(210,45,255,.16)",
    filter: "blur(90px)",
    right: -120,
    top: -90,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    padding: "44px 34px",
    borderRadius: 24,
    border: "1px solid rgba(0,255,214,.45)",
    background: "linear-gradient(145deg, rgba(3,19,22,.95), rgba(12,3,24,.93))",
    boxShadow: "0 0 38px rgba(0,255,214,.18), inset 0 0 32px rgba(210,45,255,.08)",
    position: "relative",
    zIndex: 2,
  },
  live: {
    position: "absolute",
    right: 22,
    top: 18,
    color: "#00ff88",
    fontWeight: 1000,
    fontSize: 13,
    textShadow: "0 0 12px rgba(0,255,136,.8)",
  },
  logo: {
    margin: 0,
    textAlign: "center",
    fontSize: 44,
    letterSpacing: 2,
    fontWeight: 1000,
    background: "linear-gradient(90deg, #00ffd6, #63eaff, #d72dff)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  kicker: {
    textAlign: "center",
    color: "rgba(255,255,255,.72)",
    fontWeight: 900,
    letterSpacing: 3,
    fontSize: 12,
    margin: "6px 0 28px",
  },
  title: {
    margin: "0 0 8px",
    textAlign: "center",
    fontSize: 27,
    fontWeight: 1000,
  },
  subtitle: {
    margin: "0 0 25px",
    textAlign: "center",
    color: "rgba(255,255,255,.72)",
    fontSize: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 14,
    padding: "16px 18px",
    borderRadius: 13,
    border: "1px solid rgba(0,255,214,.35)",
    background: "rgba(255,255,255,.92)",
    color: "#061011",
    fontWeight: 800,
    fontSize: 15,
    outline: "none",
  },
  message: {
    color: "#ff4d6d",
    textAlign: "center",
    fontWeight: 900,
    fontSize: 13,
  },
  button: {
    width: "100%",
    border: "1px solid rgba(0,255,214,.75)",
    borderRadius: 13,
    padding: "16px 18px",
    background: "linear-gradient(90deg, #00ffd6, #00ff88)",
    color: "#00100f",
    fontWeight: 1000,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 0 24px rgba(0,255,214,.3)",
  },
  secondary: {
    width: "100%",
    marginTop: 12,
    border: "1px solid rgba(210,45,255,.58)",
    borderRadius: 13,
    padding: "14px 18px",
    background: "rgba(210,45,255,.09)",
    color: "#f2b7ff",
    fontWeight: 1000,
    cursor: "pointer",
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
