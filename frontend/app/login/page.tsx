"use client";

import { useState, useEffect } from "react";

const API = "https://kbetz.onrender.com";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ AUTO LOGIN CHECK (NEW — DOES NOT BREAK ANYTHING)
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      window.location.href = "/dashboard";
    }
  }, []);

  const login = async () => {
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard";
      } else {
        alert(data.message || "Login failed");
      }

    } catch (err) {
      console.log("LOGIN ERROR:", err);
      alert("Login error");
    }
  };

  return (
    <div style={{
      background: "#050505",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: "white"
    }}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ margin: 10, padding: 10 }}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ margin: 10, padding: 10 }}
      />

      <button onClick={login} style={{ padding: 10 }}>
        Login
      </button>

      <div style={{ marginTop: 20 }}>
        No account? <a href="/signup">Signup</a>
      </div>
    </div>
  );
}