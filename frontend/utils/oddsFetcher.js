export async function fetchOdds() {
  try {
    const res = await fetch(
      `${"https://kbetz.onrender.com"}/api/odds`
    );

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.log("Invalid odds response:", data);
      return [];
    }

    return data;
  } catch (err) {
    console.log("Odds fetch error:", err);
    return [];
  }
}
