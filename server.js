import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("🚀 KBETZ SERVER STARTING");

// ================= STRIPE =================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ================= MONGO =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// ================= USER MODEL =================
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  isPro: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

// ================= AUTH =================
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    await User.create({ email, password, isPro: false });
  }

  res.json({ success: true });
});

app.post("/api/login", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.json({ error: "User not found" });

  res.json({
    success: true,
    isPro: user.isPro,
  });
});

app.get("/api/me", async (req, res) => {
  const email = req.query.email;

  if (!email) return res.json({ isPro: false });

  const user = await User.findOne({ email });

  res.json({ isPro: user?.isPro || false });
});

// ================= DATA =================
app.get("/api/data", (req, res) => {
  res.json({
    games: [
      { away: "Lakers", home: "Warriors", homeOdds: "-110", edgeScore: 12 },
      { away: "Celtics", home: "Bucks", homeOdds: "-105", edgeScore: 9 },
    ],
  });
});

// ================= STRIPE =================
app.post("/api/checkout", async (req, res) => {
  try {
    const { email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?email=${email}`,
      cancel_url: `${process.env.CLIENT_URL}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ CHECKOUT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= PRO =================
app.post("/api/upgrade-success", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email, isPro: true });
  } else {
    user.isPro = true;
    await user.save();
  }

  console.log("🔥 PRO ACTIVATED:", email);

  res.json({ success: true });
});

// ================= START =================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});