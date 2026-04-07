"use client";

import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup() {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      }
    );

    alert("Account created. Now login.");
    window.location.href = "/login";
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Signup</h1>

      <input onChange={(e) => setEmail(e.target.value)} />
      <input type="password" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleSignup}>Create Account</button>
    </div>
  );
}