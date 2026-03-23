"use client";

import { useState } from "react";
import { saveToken } from "../../utils/authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("http://localhost:10000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      saveToken(data.token);
      window.location.href = "/dashboard";
    } else {
      alert("Login failed");
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center">
      <div className="bg-zinc-900 p-6 rounded w-80">
        <h1 className="text-xl mb-4">KBETZ Login</h1>

        <input
          className="w-full p-2 mb-2 bg-black"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 mb-4 bg-black"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="bg-green-500 w-full p-2 text-black font-bold"
        >
          Login
        </button>
      </div>
    </div>
  );
}