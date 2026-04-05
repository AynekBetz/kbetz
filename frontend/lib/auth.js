// 🔐 SIMPLE PRO USER STORAGE

export function setProUser() {
  try {
    localStorage.setItem("kbetz_pro", "true");
  } catch (err) {
    console.log("Error setting PRO user:", err);
  }
}

export function isProUser() {
  try {
    return localStorage.getItem("kbetz_pro") === "true";
  } catch (err) {
    console.log("Error reading PRO user:", err);
    return false;
  }
}

export function clearProUser() {
  try {
    localStorage.removeItem("kbetz_pro");
  } catch (err) {
    console.log("Error clearing PRO user:", err);
  }
}
