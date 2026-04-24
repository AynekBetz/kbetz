"use client";

import { useState, useEffect } from "react";

const API = "https://kbetz.onrender.com";

export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [pulse, setPulse] = useState(false);

useEffect(() => {
const interval = setInterval(() => {
setPulse((p) => !p);
}, 1200);
return () => clearInterval(interval);
}, []);

const handleLogin = async (e) => {
e.preventDefault();
if (loading) return;


setLoading(true);

try {
  const res = await fetch(API + "/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!data || !data.token) {
    alert(data?.error || "Login failed");
    setLoading(false);
    return;
  }

  localStorage.setItem("token", data.token);
  window.location.href = "/dashboard";

} catch (err) {
  console.log(err);
  alert("Connection error");
  setLoading(false);
}


};

return (
  <div style={styles.page}>
    <div style={styles.backgroundGlow}></div>
    <div style={styles.grid}></div>

    <div style={styles.topBar}>
      <div style={styles.brand}>KBETZ</div>
      <div style={styles.status}>
        <span
          style={{
            ...styles.dot,
            background: pulse ? "#00ff99" : "#007a55"
          }}
        />
        Market Live
      </div>
    </div>

    <div style={styles.card}>
      <h1 style={styles.title}>Access Terminal</h1>
      <p style={styles.subtitle}>
        Real-time betting intelligence platform
      </p>

      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onFocus={(e) => (e.target.style.border = "1px solid #00ff99")}
          onBlur={(e) =>
            (e.target.style.border = "1px solid rgba(255,255,255,0.1)")
          }
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <div style={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onFocus={(e) => (e.target.style.border = "1px solid #00ff99")}
            onBlur={(e) =>
              (e.target.style.border = "1px solid rgba(255,255,255,0.1)")
            }
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eye}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Connecting..." : "Enter Terminal"}
        </button>
      </form>

      <div style={styles.footer}>
        Powered by live odds • AI insights • market signals
      </div>
    </div>
  </div>
);
}

/* =========================
💎 PRODUCT-LEVEL STYLES
========================= */

const styles = {
page: {
height: "100vh",
background: "#040404",
color: "white",
display: "flex",
justifyContent: "center",
alignItems: "center",
fontFamily: "Inter, sans-serif",
position: "relative",
overflow: "hidden"
},

backgroundGlow: {
position: "absolute",
width: "900px",
height: "900px",
background: "radial-gradient(circle, rgba(0,255,150,0.15), transparent)",
filter: "blur(180px)"
},

grid: {
position: "absolute",
width: "100%",
height: "100%",
backgroundImage:
"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
backgroundSize: "50px 50px"
},

topBar: {
position: "absolute",
top: 20,
width: "90%",
display: "flex",
justifyContent: "space-between",
fontSize: "12px",
opacity: 0.8
},

brand: {
letterSpacing: "2px",
fontWeight: "bold"
},

status: {
display: "flex",
alignItems: "center",
gap: "6px"
},

dot: {
width: "8px",
height: "8px",
borderRadius: "50%"
},

card: {
backdropFilter: "blur(25px)",
background: "rgba(255,255,255,0.04)",
border: "1px solid rgba(255,255,255,0.08)",
padding: "50px",
borderRadius: "18px",
width: "360px",
textAlign: "center",
boxShadow: "0 0 80px rgba(0,255,150,0.15)"
},

title: {
fontSize: "26px",
marginBottom: "8px"
},

subtitle: {
fontSize: "12px",
opacity: 0.6,
marginBottom: "30px"
},

form: {
display: "flex",
flexDirection: "column",
gap: "14px"
},

input: {
padding: "13px",
borderRadius: "8px",
border: "1px solid rgba(255,255,255,0.1)",
background: "rgba(0,0,0,0.6)",
color: "white",
outline: "none"
},

passwordWrapper: {
position: "relative",
display: "flex"
},

eye: {
position: "absolute",
right: "10px",
top: "50%",
transform: "translateY(-50%)",
cursor: "pointer",
fontSize: "11px",
opacity: 0.6
},

button: {
padding: "13px",
borderRadius: "8px",
border: "none",
background: "linear-gradient(90deg, #00ff99, #00cc66)",
color: "black",
fontWeight: "bold",
cursor: "pointer",
transition: "0.2s",
boxShadow: "0 0 25px rgba(0,255,150,0.4)"
},

footer: {
marginTop: "18px",
fontSize: "10px",
opacity: 0.4
}
};
