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

  console.log("LOGIN RESPONSE:", data); // 🔥 IMPORTANT

  if (!data.token) {
    alert("Login failed");
    return;
  }

  // ✅ store token
  localStorage.setItem("token", data.token);

  // temporary unlock (so UI shows)
  localStorage.setItem("demo", "true");

  // redirect
  window.location.href = "/dashboard";

} catch (err) {
  console.log(err);
  alert("Login error");
}
```

};

return (
<div style={{ padding: 40, color: "white", background: "#050505", minHeight: "100vh" }}> <h1>Login</h1>

```
  <form onSubmit={handleLogin}>
    <input
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <br /><br />

    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <br /><br />

    <button type="submit">Login</button>
  </form>
</div>
```

);
}
