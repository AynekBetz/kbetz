"use client";

import { useState } from "react";
import { signup } from "../../lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup() {
    const data = await signup(email, password);

    if (data.message) {
      alert("Account created!");
      window.location.href = "/login";
    } else {
      alert(data.error || "Signup failed");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b0b0f, #111827)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "white"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        padding: "40px",
        borderRadius: "16px",
        width: "320px",
        boxShadow: "0 0 30px rgba(34,197,94,0.2)"
      }}>
        <h1 style={{ color: "#22c55e" }}>Create Account</h1>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "15px",
            borderRadius: "6px",
            border: "none"
          }}
        />

        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            borderRadius: "6px",
            border: "none"
          }}
        />

        <button
          onClick={handleSignup}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "12px",
            background: "#22c55e",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}