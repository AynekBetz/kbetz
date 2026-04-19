"use client";

import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "user",
      JSON.stringify({
        email,
        plan: "pro"
      })
    );

    window.location.href = "/dashboard";
  };

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1>Signup</h1>

      <form onSubmit={handleSignup}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}