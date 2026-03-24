import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* =========================
   🔥 DEBUG ENV (CRITICAL)
========================= */
console.log("=== ENV DEBUG ===");
console.log("STRIPE KEY RAW:", process.env.STRIPE_SECRET_KEY);
console.log("PRICE ID:", process.env.STRIPE_PRICE_ID);
console.log("CLIENT URL:", process.env.CLIENT_URL);
console.log("=================");

/* =========================
   🔥 STRIPE INIT (SAFE)
========================= */
let stripe;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log("✅ Stripe initialized");
} catch (err) {
  console.log("❌ Stripe init error:", err.message);
}

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.send("KBETZ LIVE ✅");
});

/* =========================
   ODDS (WORKING)
========================= */
app.get("/odds", (req, res) => {
  console.log("📊 /odds hit");

  res.json([
    {
      id: "1",
      home_team: "Lakers",
      away_team: "Warriors",
      markets: [
        {
          outcomes: [
            { name: "Lakers", price: -120 },
            { name: "Warriors", price: 105 },
          ],
        },
      ],
    },
    {
      id: "2",
      home_team: "Celtics",
      away_team: "Bucks",
      markets: [
        {
          outcomes: [
            { name: "Celtics", price: -140 },
            { name: "Bucks", price: 120 },
          ],
        },
      ],
    },
  ]);
});

/* =========================
   🔥 STRIPE CHECKOUT
========================= */
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("💳 Creating Stripe session...");

    if (!stripe) {
      return res.status(500).json({ error: "Stripe not initialized" });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ error: "Missing STRIPE_PRICE_ID" });
    }

    if (!process.env.CLIENT_URL) {
      return res.status(500).json({ error: "Missing CLIENT_URL" });
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
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
    });

    console.log("✅ Stripe session created");

    res.json({ url: session.url });
  } catch (err) {
    console.log("❌ STRIPE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   HEALTH
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 KBETZ running on port ${PORT}`);
});