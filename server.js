import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();

// ✅ Stripe init
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log("✅ Stripe loaded");

// 🔥 WEBHOOK (FAST RESPONSE — FIXES TIMEOUT)
app.post("/webhook", express.raw({ type: "*/*" }), (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  // ✅ Respond instantly (Stripe needs this FAST)
  res.status(200).send("ok");

  // 🧠 Process AFTER response (no timeout)
  setImmediate(() => {
    try {
      const event = JSON.parse(req.body.toString());

      console.log("📦 Event type:", event.type);

      if (event.type === "checkout.session.completed") {
        global.userPlan = "pro";
        console.log("✅ User upgraded to PRO");
      }
    } catch (err) {
      console.log("❌ Webhook error:", err.message);
    }
  });
});

// ✅ MIDDLEWARE AFTER WEBHOOK
app.use(cors());
app.use(express.json());

// ✅ HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "ok", connected: true });
});

// ✅ USER ENDPOINT
app.get("/me", (req, res) => {
  res.json({
    user: {
      email: "test@kbetz.com",
      plan: global.userPlan || "free",
    },
  });
});

// 🚀 START SERVER
app.listen(10000, () => {
  console.log("🔥 KBETZ API running on port 10000");
});