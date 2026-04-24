"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleLogin = async (e: any) => {
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

} catch (err: any) {
  console.error("LOGIN ERROR:", err);
  setError(err.message || "Connection failed");
  setLoading(false);
}


};

return ( <div style={styles.page}> <div style={styles.glow}></div>


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
