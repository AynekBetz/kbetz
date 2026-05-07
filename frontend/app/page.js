"use client";

import { useState } from "react";

export default function Home() {

/* ================= STATE ================= */
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

/* ================= LOGIN ================= */
const handleLogin = async () => {
  try {
    setLoading(true);

    const API = process.env.NEXT_PUBLIC_API_URL;

    if (!API) {
      alert("API not configured");
      return;
    }

    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Login failed");
      return;
    }

    // 🔐 SAVE TOKEN + EMAIL
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", email);

    // 🚀 GO TO DASHBOARD
    window.location.href = "/dashboard";

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    alert("Connection error");
  } finally {
    setLoading(false);
  }
};

/* ================= UI ================= */
return (
<div style={styles.page}>

<div style={styles.card}>

<div style={styles.live}>● LIVE</div>

<h1 style={styles.title}>KBETZ</h1>
<p style={styles.subtitle}>Elite Betting Terminal</p>

<input
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  style={styles.input}
/>

<input
  placeholder="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  style={styles.input}
/>

<button onClick={handleLogin} style={styles.button}>
  {loading ? "Loading..." : "Enter Dashboard"}
</button>

</div>

</div>
);
}

/* ================= STYLES (UNCHANGED LOOK) ================= */

const styles = {

page:{
height:"100vh",
background:"radial-gradient(circle at center,#022,#000)",
display:"flex",
justifyContent:"center",
alignItems:"center"
},

card:{
width:"350px",
padding:"30px",
borderRadius:"16px",
background:"rgba(0,255,150,0.08)",
backdropFilter:"blur(10px)",
border:"1px solid rgba(0,255,150,0.2)",
boxShadow:"0 0 40px rgba(0,255,150,0.1)",
position:"relative"
},

live:{
position:"absolute",
top:"10px",
right:"15px",
color:"#00ff99",
fontSize:"12px"
},

title:{
textAlign:"center",
marginBottom:"5px"
},

subtitle:{
textAlign:"center",
color:"#aaa",
marginBottom:"20px"
},

input:{
width:"100%",
padding:"12px",
marginBottom:"12px",
background:"#111",
border:"none",
color:"#fff",
borderRadius:"8px"
},

button:{
width:"100%",
padding:"12px",
background:"#00ff99",
border:"none",
borderRadius:"8px",
fontWeight:"bold",
cursor:"pointer"
}

};