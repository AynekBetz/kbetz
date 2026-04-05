const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 🔥 WAKE BACKEND FIRST
async function wakeBackend() {
  try {
    console.log("🔁 Waking backend...");

    await fetch(`${API_URL}/api/health`);

    console.log("✅ Backend awake");
  } catch (err) {
    console.log("⚠️ Wake failed (will retry anyway)");
  }
}

// 🔥 GET ODDS
export async function getOdds() {
  try {
    await wakeBackend();

    const res = await fetch(`${API_URL}/api/odds`);
    return await res.json();
  } catch (err) {
    console.log("❌ Odds error:", err.message);
    return [];
  }
}

// 🔥 STRIPE CHECKOUT (RETRY SYSTEM)
export async function createCheckout() {
  try {
    await wakeBackend();

    console.log("🔥 Sending checkout request...");

    let res = await fetch(`${API_URL}/api/stripe/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    // 🔥 RETRY IF FIRST FAILS
    if (!res.ok) {
      console.log("⚠️ First attempt failed, retrying...");
      
      await new Promise(r => setTimeout(r, 2000));

      res = await fetch(`${API_URL}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const data = await res.json();

    console.log("✅ Stripe response:", data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Stripe failed: no URL");
    }

  } catch (err) {
    console.log("❌ FINAL ERROR:", err);
    alert("Backend connection failed");
  }
}