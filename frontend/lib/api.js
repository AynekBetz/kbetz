const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 🔥 STRIPE CHECKOUT (FIXED)
export async function createCheckout() {
  try {
    console.log("🔥 Calling backend:", `${API_URL}/api/stripe/checkout`);

    const res = await fetch(`${API_URL}/api/stripe/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    console.log("🔥 Stripe response:", data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed — no URL returned");
    }

  } catch (err) {
    console.log("❌ Checkout error:", err.message);
    alert("Error connecting to backend");
  }
}