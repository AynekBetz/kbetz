"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleReset = async () => {
    setMessage("");

    if (!token) {
      setMessage("This reset link is missing a valid token.");
      return;
    }

    if (!password || !confirmPassword) {
      setMessage("Enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setMessage("Password must be between 8 and 128 characters.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://kbetz-live.onrender.com/api/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(
          data?.error ||
            data?.message ||
            "KBETZ could not reset your password."
        );
        return;
      }

      setSuccess(true);
      setMessage(
        data?.message ||
          "Your KBETZ password has been reset successfully."
      );
    } catch {
      setMessage(
        "KBETZ could not connect to the password reset service. Please try again."
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

        <h2 style={styles.title}>
          {success ? "Password Reset" : "Choose New Password"}
        </h2>

        <p style={styles.subtitle}>
          {success
            ? "Your password has been updated. You can now return to login."
            : "Create a new password for your KBETZ account."}
        </p>

        {!success ? (
          <>
            <input
              style={styles.input}
              type="password"
              placeholder="New password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              style={{
                ...styles.input,
                marginTop: 12,
              }}
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleReset();
              }}
            />
          </>
        ) : null}

        {message ? (
          <p style={styles.message}>{message}</p>
        ) : null}

        {!success ? (
          <button
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        ) : null}

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
