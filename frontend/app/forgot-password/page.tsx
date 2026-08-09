"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://kbetz-live.onrender.com/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      setMessage(
        data?.message ||
          data?.error ||
          "If an account exists for that email, a password reset link has been sent."
      );
    } catch {
      setMessage(
        "KBETZ could not process your password reset request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      <section style={styles.card}>
        <div style={styles.liveBadge}>● KBETZ</div>

        <h1 style={styles.logo}>KBETZ</h1>
        <p style={styles.subLogo}>AI BETTING TERMINAL</p>

        <h2 style={styles.title}>Reset Your Password</h2>

        <p style={styles.subtitle}>
          Enter the email connected to your KBETZ account.
        </p>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        {message ? (
          <p style={styles.message}>{message}</p>
        ) : null}

        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer",
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => router.push("/login")}
        >
          ← Back to Login
        </button>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 18% 20%, rgba(0,255,214,.18), transparent 28%), radial-gradient(circle at 84% 18%, rgba(209,45,255,.24), transparent 28%), linear-gradient(135deg, #020707 0%, #041313 42%, #090212 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#ffffff",
    overflow: "hidden",
    position: "relative",
  },

  glowOne: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 999,
    background: "rgba(0,255,214,.15)",
    filter: "blur(80px)",
    left: -120,
    top: 60,
  },

  glowTwo: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 999,
    background: "rgba(210,45,255,.16)",
    filter: "blur(90px)",
    right: -100,
    top: -80,
  },

  card: {
    width: "100%",
    maxWidth: 470,
    border: "1px solid rgba(0,255,214,.45)",
    borderRadius: 22,
    padding: "42px 34px",
    background:
      "linear-gradient(145deg, rgba(3,19,22,.94), rgba(9,4,20,.92))",
    boxShadow:
      "0 0 38px rgba(0,255,214,.17), inset 0 0 28px rgba(202,45,255,.08)",
    position: "relative",
    zIndex: 2,
  },

  liveBadge: {
    position: "absolute",
    right: 22,
    top: 18,
    color: "#00ffd6",
    fontWeight: 900,
    fontSize: 13,
  },

  logo: {
    margin: 0,
    fontSize: 42,
    fontWeight: 1000,
    background:
      "linear-gradient(90deg,#00ffd6,#46dfff,#8b5cf6,#d12dff)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },

  subLogo: {
    marginTop: 2,
    color: "rgba(255,255,255,.55)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
  },

  title: {
    marginTop: 36,
    marginBottom: 8,
    fontSize: 26,
  },

  subtitle: {
    color: "rgba(255,255,255,.62)",
    lineHeight: 1.6,
    marginBottom: 24,
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: 12,
    border: "1px solid rgba(0,255,214,.25)",
    background: "rgba(0,0,0,.28)",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },

  message: {
    marginTop: 15,
    color: "#9fffea",
    fontSize: 13,
    lineHeight: 1.6,
  },

  button: {
    width: "100%",
    marginTop: 22,
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(0,255,214,.6)",
    background:
      "linear-gradient(90deg, rgba(0,255,214,.30), rgba(139,92,246,.34))",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondaryButton: {
    width: "100%",
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.04)",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 800,
  },
};
