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
   🔥 CLEAN STRIPE KEY (FIX BUG)
========================= */
const rawKey = process.env.STRIPE_SECRET_KEY || "";
const cleanKey = rawKey.replace(/\s+/g, "").trim();

console.log("=== STRIPE DEBUG ===");
console.log("RAW KEY LENGTH:", rawKey.length);
console.log("CLEAN KEY LENGTH:", cleanKey.length);
console.log("KEY START:", cleanKey.slice(0, 15));
console.log("====================");

/* =========================
   INIT STRIPE
========================= */
let stripe;

try {
  if (!cleanKey || !cleanKey.startsWith("sk_")) {
    throw new Error("Invalid Stripe key");
  }

  stripe = new Stripe(cleanKey);
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
   ODDS ROUTE
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
   🔥 STRIPE CHECKOUT (SAFE VERSION)
========================= */
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("💳 Creating Stripe session...");

    if (!stripe) {
      return res.status(500).json({ error: "Stripe not initialized" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      // 🔥 TEMP: no price ID needed (removes another failure point)
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "KBETZ Pro",
            },
            unit_amount: 500, // $5 test charge
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.CLIENT_URL}`,
      cancel_url: `${process.env.CLIENT_URL}`,
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