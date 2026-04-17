import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB ERROR:", err));

// ================= USER MODEL =================
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  plan: { type: String, default: "free" }
});

const User = mongoose.model("User", userSchema);

// ================= AUTH =================

// SIGNUP
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.json({ error: "User exists" });

    const user = await User.create({ email, password });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token });

  } catch (err) {
    console.log(err);
    res.json({ error: "Signup failed" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });
    if (!user) return res.json({ error: "Invalid login" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token });

  } catch (err) {
    console.log(err);
    res.json({ error: "Login failed" });
  }
});

// GET USER
app.get("/api/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    res.json(user);

  } catch (err) {
    res.json({ error: "Auth failed" });
  }
});

// ================= ODDS (SAFE) =================

app.get("/api/data", async (req, res) => {
  try {
    // SAFE FALLBACK DATA (prevents crash)
    const games = [
      { id: 1, home: "Lakers", away: "Warriors", odds: -110 },
      { id: 2, home: "Celtics", away: "Heat", odds: -105 }
    ];

    res.json({ games });

  } catch (err) {
    console.log("ODDS ERROR:", err);
    res.json({ games: [] });
  }
});

// ================= 🔥 STRIPE CHECKOUT =================

app.post("/api/checkout", async (req, res) => {
  try {
    console.log("🚀 CHECKOUT HIT");

    const { token } = req.body;

    if (!token) {
      return res.json({ error: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({ error: "Invalid token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json({ error: "User not found" });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return res.json({ error: "Missing STRIPE_PRICE_ID" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    console.log("✅ STRIPE URL:", session.url);

    res.json({ url: session.url });

  } catch (err) {
    console.log("🔥 STRIPE ERROR:", err.message);
    res.json({ error: err.message });
  }
});

// ================= HEALTH =================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 SERVER RUNNING ON PORT ${PORT}`);
});