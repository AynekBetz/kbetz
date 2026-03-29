import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config();

const app = express();

// ✅ CONNECT TO MONGO
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// ✅ STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log("✅ Stripe loaded");

// 🔥 WEBHOOK (REAL DB UPDATE)
app.post(["/webhook", "/webhook/"], express.raw({ type: "*/*" }), (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  // respond immediately
  res.status(200).send("ok");

  setImmediate(async () => {
    try {
      const event = JSON.parse(req.body.toString());

      console.log("📦 Event:", event.type);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const email = session.customer_email;

        console.log("💰 Payment from:", email);

        let user = await User.findOne({ email });

        if (!user) {
          user = new User({ email });
        }

        user.plan = "pro";
        user.stripeCustomerId = session.customer;
        user.stripeSubscriptionId = session.subscription;

        await user.save();

        console.log("✅ USER SAVED AS PRO IN DB");
      }

    } catch (err) {
      console.log("❌ Webhook error:", err.message);
    }
  });
});

// ✅ NORMAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// ✅ GET USER (FROM DB)
app.get("/me", async (req, res) => {
  const email = "test@kbetz.com"; // temporary (we add auth next)

  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email });
    await user.save();
  }

  res.json({ user });
});

// ✅ HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "ok", connected: true });
});

// 🚀 START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});