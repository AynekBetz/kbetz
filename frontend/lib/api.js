const API = process.env.NEXT_PUBLIC_API_URL;

export async function signup(email, password) {
  const res = await fetch(`${API}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getMe(token) {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: token },
  });
  return res.json();
}

export async function getOdds() {
  const res = await fetch(`${API}/api/odds`);
  return res.json();
}