"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async (e: any) => {
e.preventDefault();

```
try {
  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!data.token) {
    alert("Login failed");
    return;
  }

  // ✅ SAVE TOKEN
  localStorage.setItem("token", data.token);

  // optional: temporary unlock until Stripe/user plan is wired
  localStorage.setItem("demo", "true");

  // redirect to dashboard
  window.location.href = "/dashboard";

} catch (err) {
  console.log(err);
  alert("Login error");
}
```

};

return (
<div style={{
background: "#050505",
minHeight: "100vh",
color: "white",
padding: "40px"
}}> <h1>Login</h1>

```
  <form onSubmit={handleLogin}>
    <input
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      style={{ padding: 10, marginBottom: 10, width: 250 }}
    />

    <br />

    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      style={{ padding: 10, marginBottom: 10, width: 250 }}
    />

    <br />

    <button style={{
      padding: "10px 20px",
      background: "gold",
      border: "none",
      cursor: "pointer"
    }}>
      Login
    </button>
  </form>
</div>
```

);
}
