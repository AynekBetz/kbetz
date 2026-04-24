const API = "https://kbetz.onrender.com";

// 🔐 SAVE TOKEN
export function setToken(token) {
  localStorage.setItem("kbetz_token", token);
}

// 🔐 GET TOKEN
export function getToken() {
  return localStorage.getItem("kbetz_token");
}

// 🔐 LOGOUT
export function logout() {
  localStorage.removeItem("kbetz_token");
}

// 🔐 GET USER
export async function getUser() {
  const token = getToken();

  if (!token) return null;

  try {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: token }
    });

    return await res.json();
  } catch {
    return null;
  }
}