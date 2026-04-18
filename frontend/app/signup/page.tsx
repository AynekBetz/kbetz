"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signup = async () => {
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Signup successful");
        window.location.href = "/login";
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.log(err);
      alert("Signup error");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Signup</h1>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={signup}>Create Account</button>

      <div style={{ marginTop: 20 }}>
        Already have account? <a href="/login">Login</a>
      </div>
    </div>
  );
}