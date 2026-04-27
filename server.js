import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import fetch from "node-fetch";

dotenv.config();

console.log("🚀 KBETZ STABLE SERVER STARTING");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
🔥 STRIPE WEBHOOK (MUST BE FIRST)
========================= */
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

/* =========================
🔥 CORS
========================= */
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://kbetz-frontend.vercel.app",
    "https://kbetz.vercel.app"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

/* =========================
✅ DATABASE
========================= */
mongoose.set("bufferCommands", false);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
  }
}

/* =========================
✅ MODEL
========================= */
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema({
      email: String,
      password: String,
      plan: { type: String, default: "free" },
      isPro: { type: Boolean, default: false }
    })
  );

/* =========================
✅ HEALTH
========================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

/* =========================
✅ SIGNUP
========================= */
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, message: "Missing email/password" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: "User exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashed,
      plan: "free",
      isPro: false
    });

    return res.json({ success: true });

  } catch (err) {
    console.log("❌ SIGNUP ERROR:", err);
    return res.json({ success: false, message: err.message });
  }
});

/* =========================
🔐 LOGIN
========================= */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid login" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid login" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        email: user.email,
        isPro: user.isPro
      }
    });

  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

/* =========================
👤 ME
========================= */
app.get("/api/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      email: user.email,
      isPro: user.isPro
    });

  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

/* =========================
📡 DATA
========================= */
app.get("/api/data", async (req, res) => {
  try {
    const API_KEY = process.env.ODDS_API_KEY;

    if (!API_KEY) throw new Error("No API key");

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h`
    );

    const data = await response.json();

    const games = data.slice(0, 5).map((g, i) => ({
      id: i,
      home: g.home_team,
      away: g.away_team,
      odds:
        g.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || -110
    }));

    res.json({ source: "real", games });

  } catch {
    res.json({
      source: "fallback",
      games: [
        { id: 1, home: "Lakers", away: "Warriors", odds: -110 },
        { id: 2, home: "Celtics", away: "Heat", odds: -105 }
      ]
    });
  }
});

/* =========================
💳 STRIPE
========================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =========================
💳 CHECKOUT (FIXED)
========================= */
const createCheckoutSession = async (email) => {
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      { price: process.env.STRIPE_PRICE_ID, quantity: 1 }
    ],
    customer_email: email,
    success_url: "https://kbetz.vercel.app/dashboard?upgrade=success",
    cancel_url: "https://kbetz.vercel.app/dashboard"
  });
};

// ORIGINAL ROUTE (UNCHANGED)
app.post("/api/stripe/checkout", async (req, res) => {
  try {
    const { email } = req.body;
    const session = await createCheckoutSession(email);
    res.json({ url: session.url });
  } catch (err) {
    console.log("CHECKOUT ERROR:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// 🔥 NEW ROUTE (FIXES YOUR FRONTEND)
app.post("/api/checkout", async (req, res) => {
  try {
    const { email } = req.body;
    const session = await createCheckoutSession(email);
    res.json({ url: session.url });
  } catch (err) {
    console.log("CHECKOUT ERROR:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

/* =========================
🔥 WEBHOOK
========================= */
app.post("/api/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;

    const user = await User.findOne({ email });

    if (user) {
      user.isPro = true;
      user.plan = "pro";
      await user.save();
    }
  }

  res.json({ received: true });
});

/* =========================
🚀 START
========================= */
async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
  });
}

start();