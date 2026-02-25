import express from "express";
import mongoose from "mongoose";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

/* ===============================
   ENV VARIABLES
=============================== */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const CLIENT_URL = process.env.CLIENT_URL || "https://kbetz.onrender.com";

const stripe = new Stripe(STRIPE_SECRET_KEY);

/* ===============================
   CONNECT TO MONGODB
=============================== */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("Mongo Error:", err));

/* ===============================
   USER MODEL
=============================== */
const userSchema = new mongoose.Schema({
  email: String,
  isPro: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

/* ===============================
   HEALTH ROUTE
=============================== */
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

/* ===============================
   CREATE CHECKOUT SESSION
=============================== */
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,

      // 🔥 THIS IS WHERE YOUR REAL PRICE ID GOES
      line_items: [
        {
          price: "price_1T3faVCw81OP3G6S1jP2e8RF", // ⬅️ REPLACE WITH YOUR REAL PRICE ID
          quantity: 1,
        },
      ],

      success_url: `${CLIENT_URL}/success`,
      cancel_url: `${CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

/* ===============================
   SUCCESS ROUTE
=============================== */
app.get("/success", (req, res) => {
  res.send(`
    <h1>🎉 Subscription Successful!</h1>
    <p>Your payment was processed successfully.</p>
    <p>You can now close this page.</p>
  `);
});

/* ===============================
   CANCEL ROUTE
=============================== */
app.get("/cancel", (req, res) => {
  res.send(`
    <h1>❌ Payment Cancelled</h1>
    <p>Your subscription was not completed.</p>
  `);
});

/* ===============================
   ROOT ROUTE
=============================== */
app.get("/", (req, res) => {
  res.send("🚀 KBetz API Running");
});

/* ===============================
   START SERVER
=============================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});