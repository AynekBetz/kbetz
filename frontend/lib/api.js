const API = process.env.NEXT_PUBLIC_API_URL;

export async function getHealth() {
  const res = await fetch(`${API}/health`);
  if (!res.ok) throw new Error("Backend error");
  return res.json();
}

export async function getUser() {
  const res = await fetch(`${API}/me`);
  if (!res.ok) throw new Error("User fetch failed");
  return res.json();
}