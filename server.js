import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());

/* ===============================
   MongoDB Connection
=============================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

/* ===============================
   User Schema
=============================== */
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isPro: { type: Boolean, default: false },
  stripeCustomerId: String,
});

const User = mongoose.model("User", userSchema);

/* ===============================
   Health Route
=============================== */
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    mongo:
      mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
});

/* ===============================
   Stripe Checkout Route (DEBUG VERSION)
=============================== */
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    console.log("🔥 Checkout request received");
    console.log("Request Body:", req.body);
    console.log("Stripe Key Exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("Stripe Price ID:", process.env.STRIPE_PRICE_ID);

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

    console.log("✅ Stripe session created:", session.id);

    res.json({ url: session.url });

  } catch (error) {
    console.log("❌ STRIPE ERROR FULL:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   Root Route
=============================== */
app.get("/", (req, res) => {
  res.send("🚀 KBetz API is running");
});

/* ===============================
   Start Server
=============================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});