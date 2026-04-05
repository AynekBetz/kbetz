"use client";

import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e: any) => {
    e.preventDefault();
    alert("Signup coming soon");
  };

  return (
    <div style={{
      background: "#020202",
      color: "white",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <h1>Signup</h1>

      <form onSubmit={handleSignup} style={{
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
          Create Account
        </button>
      </form>
    </div>
  );
}