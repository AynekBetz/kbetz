"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Signup() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleSignup = async (e: any) => {
e.preventDefault();
if (loading) return;


setLoading(true);
setError("");

try {
  const res = await fetch(`${API}/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  let data;

  try {
    data = await res.json();
  } catch {
    throw new Error("Server response error");
  }

  console.log("SIGNUP RESPONSE:", data);

  // 🔥 SMART HANDLING
  if (!res.ok || !data?.success) {

    // 👉 If account already exists → redirect to login
    if (data?.message?.toLowerCase().includes("exists")) {
      alert("Account already exists — please log in");
      window.location.href = "/login";
      return;
    }

    throw new Error(data?.message || "Signup failed");
  }

  // ✅ SUCCESS
  alert("Account created successfully!");
  window.location.href = "/login";

} catch (err: any) {
  console.error("SIGNUP ERROR:", err);
  setError(err.message || "Signup failed");
  setLoading(false);
}


};

return ( <div style={styles.page}> <div style={styles.glow}></div>


  <div style={styles.card}>
    <div style={styles.live}>● LIVE</div>

    <h1 style={styles.title}>KBETZ</h1>
    <p style={styles.subtitle}>Create Your Account</p>

    <form onSubmit={handleSignup} style={styles.form}>
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      {error && <div style={styles.error}>{error}</div>}

      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? "Creating..." : "Create Account"}
      </button>
    </form>

    {/* 🔥 OPTIONAL NICE UX (keeps your design style) */}
    <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
      Already have an account?{" "}
      <a href="/login" style={{ color: "#00ff99" }}>
        Log in
      </a>
    </p>
  </div>
</div>


);
}

/* =========================
STYLES (UNCHANGED)
========================= */

const styles = {
page: {
height: "100vh",
background: "#050505",
display: "flex",
justifyContent: "center",
alignItems: "center",
color: "white",
position: "relative" as const,
overflow: "hidden",
fontFamily: "Inter, sans-serif",
},

glow: {
position: "absolute" as const,
width: "700px",
height: "700px",
background: "radial-gradient(circle, rgba(0,255,150,0.25), transparent)",
filter: "blur(140px)",
pointerEvents: "none" as const,
},

card: {
background: "rgba(255,255,255,0.05)",
backdropFilter: "blur(20px)",
padding: "40px",
borderRadius: "16px",
border: "1px solid rgba(255,255,255,0.1)",
textAlign: "center" as const,
width: "340px",
boxShadow: "0 0 50px rgba(0,255,150,0.2)",
position: "relative" as const,
},

live: {
position: "absolute" as const,
top: "10px",
right: "15px",
fontSize: "12px",
color: "#00ff99",
fontWeight: "bold",
},

title: {
fontSize: "28px",
marginBottom: "5px",
letterSpacing: "2px",
},

subtitle: {
fontSize: "12px",
opacity: 0.7,
marginBottom: "25px",
},

form: {
display: "flex",
flexDirection: "column" as const,
gap: "12px",
},

input: {
padding: "12px",
borderRadius: "8px",
border: "1px solid rgba(255,255,255,0.1)",
background: "#111",
color: "white",
},

error: {
color: "#ff4d4d",
fontSize: "12px",
},

button: {
padding: "12px",
borderRadius: "8px",
border: "none",
background: "linear-gradient(90deg, #00ff99, #00cc66)",
color: "black",
fontWeight: "bold",
cursor: "pointer",
},
};
