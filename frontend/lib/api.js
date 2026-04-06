// ✅ NO MORE BACKEND CALLS FOR CHECKOUT

export async function getOdds() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odds`);
    return await res.json();
  } catch {
    return [];
  }
}

// 🔥 STRIPE (LOCAL API ROUTE ONLY)
export async function createCheckout() {
  try {
    console.log("🔥 Calling LOCAL /api/checkout");

    const res = await fetch("/api/checkout", {
      method: "POST"
    });

    const data = await res.json();

    console.log("Stripe response:", data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed: " + JSON.stringify(data));
    }

  } catch (err) {
    console.log("ERROR:", err);
    alert("Checkout error");
  }
}