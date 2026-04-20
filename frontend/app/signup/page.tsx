"use client";

import { useState } from "react";

const API = "https://kbetz.onrender.com";

export default function Signup() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleSignup = async (e: any) => {
e.preventDefault();

```
try {
  const res = await fetch(`${API}/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!data.success) {
    alert("Signup failed");
    return;
  }

  alert("Account created! Now login.");
  window.location.href = "/login";

} catch (err) {
  console.log(err);
  alert("Signup error");
}
```

};

return (
<div style={{
background: "#050505",
minHeight: "100vh",
color: "white",
padding: "40px"
}}> <h1>Signup</h1>

```
  <form onSubmit={handleSignup}>
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
      background: "lime",
      border: "none",
      cursor: "pointer"
    }}>
      Create Account
    </button>
  </form>
</div>
```

);
}
