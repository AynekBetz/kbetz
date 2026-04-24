const API = "https://kbetz.onrender.com";

export async function login(email, password) {
  const res = await fetch(`${API}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Bad server response");
  }

  if (!res.ok) {
    throw new Error(data?.error || "Login failed");
  }

  localStorage.setItem("token", data.token);
  return data;
}