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

// 🔥 CHECKOUT (NOW GET — NO CORS ISSUES)
router.get("/checkout", async (req, res) => {
  try {
    console.log("🔥 STARTING CHECKOUT...");

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

    console.log("✅ STRIPE SESSION CREATED:", session.id);

    // 🔥 REDIRECT DIRECTLY (NO JSON)
    res.redirect(session.url);

  } catch (err) {
    console.log("❌ STRIPE ERROR:", err.message);
    res.status(500).send(err.message);
  }
});

export default router;