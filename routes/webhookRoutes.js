import express from "express";
import Stripe from "stripe";
import User from "../models/User.js";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // 🔥 CREATE STRIPE HERE
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log("❌ Webhook error:", err.message);
      return res.sendStatus(400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email = session.customer_email;

      const user = await User.findOne({ email });

      if (user) {
        user.isPro = true;
        await user.save();

        console.log("🔥 USER UPGRADED:", email);
      }
    }

    res.json({ received: true });
  }
);

export default router;