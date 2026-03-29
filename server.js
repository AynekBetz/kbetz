import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();

// ✅ Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log("✅ Stripe loaded");

// 🔥 WEBHOOK (HANDLES /webhook AND /webhook/ + FAST RESPONSE)
app.post(
  ["/webhook", "/webhook/"],
  express.raw({ type: "*/*" }),
  (req, res) => {
    console.log("🔥 WEBHOOK HIT");

    // ✅ RESPOND IMMEDIATELY (prevents Stripe timeout)
    res.status(200).send("ok");

    // 🧠 Process AFTER response
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
  }
);

// ✅ MIDDLEWARE (AFTER webhook)
app.use(cors());
app.use(express.json());

// ✅ HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "ok", connected: true });
});

// ✅ USER STATUS
app.get("/me", (req, res) => {
  res.json({
    user: {
      email: "test@kbetz.com",
      plan: global.userPlan || "free",
    },
  });
});

// 🚀 START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});