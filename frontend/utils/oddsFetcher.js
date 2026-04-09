export async function fetchOdds() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/odds`
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
