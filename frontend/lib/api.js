const API = "https://kbetz.onrender.com";

export async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: token
      ? { Authorization: "Bearer " + token }
      : {},
  });

  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.json();
}