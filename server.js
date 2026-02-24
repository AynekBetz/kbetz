import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ===============================
// Middleware
// ===============================
app.use(express.json());

// ===============================
// MongoDB Connection
// ===============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ===============================
// User Model
// ===============================
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isPro: { type: Boolean, default: false },
  stripeCustomerId: String,
});

const User = mongoose.model("User", userSchema);

// ===============================
// Health Check Route
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    mongo:
      mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
});

// ===============================
// Create Stripe Checkout Session
// ===============================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    // Ensure user exists
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: "https://kbetz.onrender.com/success",
      cancel_url: "https://kbetz.onrender.com/cancel",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.log("❌ Stripe Checkout Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// Stripe Webhook (IMPORTANT)
// ===============================
app.post(
  "/api/webhook",
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
      console.log("❌ Webhook signature verification failed.");
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle completed checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email = session.customer_email;

      const user = await User.findOne({ email });

      if (user) {
        user.isPro = true;
        user.stripeCustomerId = session.customer;
        await user.save();
        console.log("🔥 User upgraded to PRO:", email);
      }
    }

    res.json({ received: true });
  }
);

// ===============================
// Pro Middleware
// ===============================
const requirePro = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const user = await User.findOne({ email });

  if (!user || !user.isPro) {
    return res.status(403).json({ error: "Pro subscription required" });
  }

  next();
};

// ===============================
// Example Pro Route
// ===============================
app.post("/api/pro/ev-scan", requirePro, (req, res) => {
  res.json({
    message: "Welcome to Pro EV Scanner 🚀",
  });
});

// ===============================
// Root Route (Prevents Cannot GET /)
// ===============================
app.get("/", (req, res) => {
  res.send("KBetz API is running 🚀");
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});