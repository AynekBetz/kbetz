const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 🔥 REQUIRED (THIS FIXES BUILD ERROR)
export async function getOdds() {
  try {
    const res = await fetch(`${API_URL}/api/odds`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log("❌ Odds error:", err.message);
    return [];
  }
}

// 🔥 STRIPE (GET VERSION — NO CORS ISSUES)
export function createCheckout() {
  const url = `${API_URL}/api/stripe/checkout`;

  console.log("🔥 Redirecting to:", url);

  window.location.href = url;
}