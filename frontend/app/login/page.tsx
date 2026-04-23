"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

const handleLogin = async (e) => {
e.preventDefault();
if (loading) return;


setLoading(true);

try {
  const res = await fetch(API + "/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  console.log("LOGIN RESPONSE:", data);

  // ✅ UPDATED ERROR HANDLING (THIS IS THE FIX)
  if (!data || !data.token) {
    alert(data?.error || "Login failed");
    setLoading(false);
    return;
  }

  // ✅ SAVE TOKEN
  localStorage.setItem("token", data.token);

  // ✅ REDIRECT TO DASHBOARD
  window.location.href = "/dashboard";

} catch (err) {
  console.log("LOGIN ERROR:", err);
  alert("Login error");
  setLoading(false);
}


};

return (
<div style={{ padding: 40, background: "#050505", color: "white", minHeight: "100vh" }}> <h1>Login</h1>


  <form onSubmit={handleLogin}>
    <input
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      style={{ padding: "10px", marginBottom: "10px", width: "250px" }}
    />

    <br />

    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      style={{ padding: "10px", marginBottom: "10px", width: "250px" }}
    />

    <br />

    <button type="submit" disabled={loading}>
      {loading ? "Logging in..." : "Login"}
    </button>
  </form>
</div>


);
}
