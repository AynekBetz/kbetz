"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signup = async () => {
    const res = await fetch(`${API}/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Signup successful → login now");
      window.location.href = "/login";
    } else {
      alert("Signup failed");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Account</h1>

      <input
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={signup}>Sign Up</button>

      <div style={{ marginTop: 20 }}>
        Already have account? <a href="/login">Login</a>
      </div>
    </div>
  );
}