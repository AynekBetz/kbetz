import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 TEST ROUTE
router.get("/test", (req, res) => {
  res.json({ status: "Stripe route working" });
});

// 🔥 CHECKOUT
router.post("/checkout", async (req, res) => {
  try {
    console.log("🔥 Creating Stripe session...");

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Missing Stripe key" });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ error: "Missing price ID" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: "https://kbetz-frontend.vercel.app/dashboard?success=true",
      cancel_url: "https://kbetz-frontend.vercel.app/dashboard"
    });

    console.log("✅ Stripe session created:", session.id);

    res.json({ url: session.url });

  } catch (err) {
    console.log("❌ Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;