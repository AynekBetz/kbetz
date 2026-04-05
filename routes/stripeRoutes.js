import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 CREATE CHECKOUT SESSION
router.post("/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: "https://kbetz-frontend.vercel.app/dashboard",
      cancel_url: "https://kbetz-frontend.vercel.app/dashboard"
    });

    res.json({ url: session.url });

  } catch (err) {
    console.log("❌ Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;