"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: any) => {
    e.preventDefault();

    // TEMP SAFE LOGIN
    alert("Login system coming soon");
  };

  return (
    <div style={{
      background: "#020202",
      color: "white",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin} style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "300px"
      }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}