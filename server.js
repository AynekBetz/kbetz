import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

import { calculateEV } from "./utils/ev.js";
import { calculateKelly } from "./utils/kelly.js";
import { calculateHedge } from "./utils/hedge.js";

const app = express();

/* ===========================
   ENV VARIABLES
=========================== */

const PORT = process.env.PORT || 10000;
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY);

/* ===========================
   MIDDLEWARE
=========================== */

app.use(cors());
app.use(express.json());

/* ===========================
   DATABASE
=========================== */

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

/* ===========================
   MODELS
=========================== */

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  bankroll: { type: Number, default: 0 },
  role: { type: String, default: "free" },
  stripeCustomerId: String,
  subscriptionStatus: { type: String, default: "inactive" }
});

const betSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  sport: String,
  market: String,
  odds: Number,
  stake: Number,
  result: { type: String, default: "pending" },
  profit: Number,
  createdAt: { type: Date, default: Date.now }
});

const bankrollHistorySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  bankroll: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Bet = mongoose.model("Bet", betSchema);
const BankrollHistory = mongoose.model("BankrollHistory", bankrollHistorySchema);

/* ===========================
   AUTH MIDDLEWARE
=========================== */

function auth(requiredRole = null) {
  return async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: "Pro subscription required" });
      }

      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

/* ===========================
   HEALTH
=========================== */

app.get("/api/health", (req, res) => {
  res.json({ status: "Healthy" });
});

/* ===========================
   REGISTER
=========================== */

app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashed
    });

    res.json({ message: "User registered successfully" });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
});

/* ===========================
   LOGIN
=========================== */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ===========================
   BANKROLL
=========================== */

app.post("/api/bankroll", auth(), async (req, res) => {
  try {
    const { amount } = req.body;

    req.user.bankroll = amount;
    await req.user.save();

    await BankrollHistory.create({
      userId: req.user._id,
      bankroll: amount
    });

    res.json({ bankroll: amount });
  } catch {
    res.status(500).json({ error: "Bankroll update failed" });
  }
});

app.get("/api/bankroll/history", auth(), async (req, res) => {
  const history = await BankrollHistory.find({
    userId: req.user._id
  }).sort({ createdAt: 1 });

  res.json(history);
});

/* ===========================
   EV ENGINE (PRO ONLY)
=========================== */

app.post("/api/ev", auth("pro"), (req, res) => {
  const { odds, trueProbability } = req.body;

  const result = calculateEV(odds, trueProbability);

  res.json(result);
});

/* ===========================
   KELLY ENGINE
=========================== */

app.post("/api/kelly", auth(), (req, res) => {
  const { odds, trueProbability, bankroll, fraction } = req.body;

  const result = calculateKelly(
    odds,
    trueProbability,
    bankroll,
    fraction || 1
  );

  if (result.rawKelly > 0.25) {
    result.warning = "High volatility bet. Consider fractional Kelly.";
  }

  if (result.rawKelly < 0) {
    result.warning = "Negative EV bet. Do not place.";
  }

  res.json(result);
});

/* ===========================
   HEDGE ENGINE
=========================== */

app.post("/api/hedge", auth(), (req, res) => {
  const { stake1, odds1, odds2 } = req.body;

  const result = calculateHedge(stake1, odds1, odds2);

  res.json(result);
});

/* ===========================
   SPORTS API
=========================== */

app.get("/api/sports", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}`
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Odds API error" });
    }

    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

/* ===========================
   STRIPE CHECKOUT
=========================== */

app.post("/api/create-checkout-session", auth(), async (req, res) => {
  try {
    let customerId = req.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email
      });

      req.user.stripeCustomerId = customer.id;
      await req.user.save();

      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: "YOUR_STRIPE_PRICE_ID",
          quantity: 1
        }
      ],
      success_url: "https://kbetz.onrender.com/success",
      cancel_url: "https://kbetz.onrender.com/cancel"
    });

    res.json({ url: session.url });
  } catch {
    res.status(500).json({ error: "Stripe session failed" });
  }
});

/* ===========================
   STRIPE WEBHOOK
=========================== */

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const user = await User.findOne({
        stripeCustomerId: session.customer
      });

      if (user) {
        user.role = "pro";
        user.subscriptionStatus = "active";
        await user.save();
      }
    }

    res.json({ received: true });
  }
);

/* ===========================
   START SERVER
=========================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
