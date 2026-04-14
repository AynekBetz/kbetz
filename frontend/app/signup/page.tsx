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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      alert("Signup successful");
    } else {
      alert("Signup failed");
    }
  };

  return (
    <div>
      <h1>Signup</h1>
      <input onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="password" />
      <button onClick={signup}>Create Account</button>
    </div>
  );
}