require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// SAFE STRIPE INIT (won't crash if missing key)
let stripe = null;

try {
  const Stripe = require("stripe");

  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log("✅ Stripe loaded");
  } else {
    console.log("⚠️ Stripe key missing (safe mode)");
  }
} catch (err) {
  console.log("⚠️ Stripe failed to load");
}

app.use(cors());
app.use(express.json());

// ===============================
// HEALTH
// ===============================
app.get("/health", (req, res) => {
  res.json({ status: "ok", connected: true });
});

// ===============================
// USER
// ===============================
app.get("/me", (req, res) => {
  res.json({
    user: {
      email: "test@kbetz.com",
      plan: "free",
    },
  });
});

// ===============================
// STRIPE (SAFE)
// ===============================
app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        error: "Stripe not configured",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: "https://kbetz.vercel.app/dashboard",
      cancel_url: "https://kbetz.vercel.app/dashboard",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Stripe failed" });
  }
});

// ===============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});