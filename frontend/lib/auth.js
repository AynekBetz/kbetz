const API = "https://kbetz.onrender.com";

export async function login(email, password) {
  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error("Login failed");

  localStorage.setItem("token", data.token);
  return data;
}