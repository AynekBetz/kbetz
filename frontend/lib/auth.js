export function isProUser() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("kbetz_pro") === "true";
}

export function setProUser() {
  if (typeof window === "undefined") return;
  localStorage.setItem("kbetz_pro", "true");
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kbetz_pro");
}