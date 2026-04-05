const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 🔥 GET ODDS
export async function getOdds() {
  try {
    console.log("🔥 Fetching odds from:", `${API_URL}/api/odds`);

    const res = await fetch(`${API_URL}/api/odds`);
    const data = await res.json();

    return data;
  } catch (err) {
    console.log("❌ Odds error:", err.message);
    return [];
  }
}

// 🔥 STRIPE CHECKOUT (FINAL FIX)
export async function createCheckout() {
  try {
    console.log("🔥 Sending POST...");

    const res = await fetch(`${API_URL}/api/stripe/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      throw new Error("Server response not OK");
    }

    const data = await res.json();

    console.log("✅ Stripe response:", data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Stripe failed: no URL returned");
    }

  } catch (err) {
    console.log("❌ FULL ERROR:", err);
    alert("Backend connection failed — server may be waking up");
  }
}