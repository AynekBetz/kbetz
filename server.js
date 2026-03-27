require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

// ===============================
// 🔐 INIT STRIPE
// ===============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ===============================
// 🧱 MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// ✅ HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    connected: true,
  });
});

// ===============================
// ✅ TEST USER
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
// 💰 STRIPE CHECKOUT (CRITICAL)
// ===============================
app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({
        error: "Missing STRIPE_PRICE_ID",
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
    console.error("❌ Stripe error:", err.message);
    res.status(500).json({
      error: "Stripe failed",
    });
  }
});

// ===============================
// 🚀 START SERVER
// ===============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});