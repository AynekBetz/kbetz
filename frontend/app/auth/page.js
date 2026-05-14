"use client";

import { useState, useEffect } from "react";

export default function AuthPage() {
  const API = "https://kbetz-main.onrender.com";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    if (savedEmail) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      return alert("Enter email & password");
    }

    const endpoint = isLogin ? "/api/login" : "/api/signup";

    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("email", email);
      window.location.href = "/dashboard";
    } else {
      alert(data.error || "Auth failed");
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#000", color: "#fff" }}>
      <div style={{ padding: 30, background: "#111", borderRadius: 10 }}>
        <h1>KBETZ</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: 10, padding: 10 }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: 10, padding: 10 }}
        />

        <button onClick={handleSubmit} style={{ padding: 10 }}>
          {isLogin ? "Log In" : "Create Account"}
        </button>

        <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer" }}>
          {isLogin ? "Sign up" : "Log in"}
        </p>
      </div>
    </div>
  );
}