import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 🔥 INIT STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 TEST ROUTE (CONFIRMED WORKING)
router.get("/test", (req, res) => {
  res.json({ status: "Stripe route working" });
});

// 🔥 CHECKOUT ROUTE (FINAL VERSION)
router.post("/checkout", async (req, res) => {
  try {
    console.log("🔥 STARTING CHECKOUT...");

    // 🔍 DEBUG ENV
    console.log("🔑 STRIPE_SECRET_KEY EXISTS:", !!process.env.STRIPE_SECRET_KEY);
    console.log("💰 STRIPE_PRICE_ID:", process.env.STRIPE_PRICE_ID);

    // ❌ FAIL FAST IF MISSING
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        error: "Missing STRIPE_SECRET_KEY"
      });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({
        error: "Missing STRIPE_PRICE_ID"
      });
    }

    // 🔥 CREATE SESSION
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

    // ✅ RETURN URL
    res.json({
      url: session.url
    });

  } catch (err) {
    console.log("❌ STRIPE FULL ERROR:");
    console.log(err);

    res.status(500).json({
      error: err.message,
      type: err.type,
      code: err.code
    });
  }
});

export default router;