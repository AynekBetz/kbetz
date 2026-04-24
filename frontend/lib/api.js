const API = "https://kbetz.onrender.com";

export async function getData() {
  const res = await fetch(`${API}/api/data`);
  return res.json();
}