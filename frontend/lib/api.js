const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ GET ODDS
export async function getOdds() {
  try {
    const res = await fetch(`${API_URL}/api/odds`);
    return await res.json();
  } catch {
    return [];
  }
}

// ✅ STRIPE (WORKING VERSION)
export async function createCheckout() {
  try {
    const res = await fetch(`${API_URL}/api/stripe/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed");
    }

  } catch (err) {
    alert("Backend connection failed");
  }
}