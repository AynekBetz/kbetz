import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

dotenv.config();

const app = express();

// 🔥 IMPORTANT: webhook BEFORE json middleware
app.post("/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  res.status(200).send("ok");

  try {
    const event = JSON.parse(req.body.toString());

    console.log("📦 Stripe Event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_email;

      let user = await User.findOne({ email });

      if (user) {
        user.plan = "pro";
        user.stripeCustomerId = session.customer;
        user.stripeSubscriptionId = session.subscription;
        await user.save();

        console.log("✅ USER UPGRADED TO PRO:", email);
      }
    }
  } catch (err) {
    console.log("❌ Webhook error:", err.message);
  }
});

// ✅ NORMAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// ✅ CONNECT DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// ✅ STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log("✅ Stripe loaded");


// 🚀 =============================
// 🔐 AUTH ROUTES
// 🚀 =============================

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: "User exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({ email, password: hashed });
  await user.save();

  res.json({ message: "User created" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

// AUTH MIDDLEWARE
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// GET CURRENT USER
app.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user });
});


// 🚀 =============================
// 💰 STRIPE CHECKOUT
// 🚀 =============================

app.get("/api/checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: "https://kbetz.vercel.app/dashboard",
    cancel_url: "https://kbetz.vercel.app/dashboard",
  });

  res.redirect(session.url);
});


// 🚀 =============================
// 📊 USER STATS
// 🚀 =============================

// UPDATE BET RESULT
app.post("/api/bet-result", async (req, res) => {
  const { email, won, profit } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  user.totalBets += 1;

  if (won) {
    user.wins += 1;
    user.profit += profit;
  } else {
    user.losses += 1;
    user.profit -= profit;
  }

  await user.save();

  res.json({ message: "Stats updated" });
});

// 🏆 LEADERBOARD
app.get("/api/leaderboard", async (req, res) => {
  const users = await User.find()
    .sort({ profit: -1 })
    .limit(10)
    .select("email profit wins losses");

  res.json(users);
});


// 🚀 =============================
// 📡 ODDS API
// 🚀 =============================

app.get("/api/odds", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.log("❌ Odds fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch odds" });
  }
});


// 🚀 =============================
// ❤️ HEALTH CHECK
// 🚀 =============================

app.get("/health", (req, res) => {
  res.json({ status: "ok", connected: true });
});


// 🚀 =============================
// 🚀 START SERVER
// 🚀 =============================

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});