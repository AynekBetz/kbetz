import express from "express";
import cors from "cors";
import Stripe from "stripe";

const app = express();

// 🔥 CORS FIX (VERY IMPORTANT)
app.use(cors({
  origin: [
    "https://kbetz.vercel.app",
    "https://kbetz-git-main-kbetz.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 10000;

// 🔥 STRIPE INIT
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// =============================
// ROOT
// =============================
app.get("/", (req, res) => {
  res.send("KBETZ API LIVE ✅");
});

// =============================
// HEALTH
// =============================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    connected: true
  });
});

// =============================
// USER (TEMP)
// =============================
app.get("/me", (req, res) => {
  res.json({
    user: {
      id: "demo-user",
      email: "demo@kbetz.com",
      plan: "free"
    }
  });
});

// =============================
// 💰 STRIPE CHECKOUT SESSION
// =============================
app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ error: "Missing STRIPE_PRICE_ID" });
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
      success_url: "https://kbetz.vercel.app/success",
      cancel_url: "https://kbetz.vercel.app",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("STRIPE ERROR:", err);
    res.status(500).json({ error: "Stripe session failed" });
  }
});

// =============================
// START SERVER
// =============================
app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});