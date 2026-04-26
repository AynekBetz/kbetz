import express from "express";
import Stripe from "stripe";
import User from "../models/User.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// =======================
// CHECKOUT SESSION
// =======================
router.post("/checkout", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
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

      customer_email: email,

      success_url: "https://kbetz.vercel.app/dashboard?upgrade=success",
      cancel_url: "https://kbetz.vercel.app/dashboard",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.log("CHECKOUT ERROR:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// =======================
// STRIPE WEBHOOK (PRO UNLOCK)
// =======================
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {

    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log("❌ Webhook signature failed");
      return res.sendStatus(400);
    }

    // 🔥 PAYMENT SUCCESS
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email = session.customer_email;

      console.log("💰 PAYMENT SUCCESS:", email);

      const user = await User.findOne({ email });

      if (user) {
        user.isPro = true;
        await user.save();

        console.log("✅ USER UPGRADED TO PRO");
      } else {
        console.log("❌ USER NOT FOUND FOR:", email);
      }
    }

    res.json({ received: true });
  }
);

export default router;