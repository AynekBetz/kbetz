"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        alert("Login failed");
      }
    } catch (err) {
      console.log(err);
      alert("Login error");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={login}>Login</button>

      <div style={{ marginTop: 20 }}>
        No account? <a href="/signup">Signup</a>
      </div>
    </div>
  );
}