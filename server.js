import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import fetch from "node-fetch";
import User from "./models/User.js";

dotenv.config();

const app = express();

// ================= STRIPE WEBHOOK =================
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("❌ Webhook signature failed");
    return res.status(400).send(`Webhook Error`);
  }

  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    const email = obj.customer_email;
    console.log("💰 UPGRADE:", email);

    await User.findOneAndUpdate({ email }, { plan: "pro" });
  }

  if (
    event.type === "invoice.payment_failed" ||
    event.type === "customer.subscription.deleted"
  ) {
    const email = obj.customer_email;
    console.log("❌ DOWNGRADE:", email);

    await User.findOneAndUpdate({ email }, { plan: "free" });
  }

  res.json({ received: true });
});

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET;

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.log("❌ Mongo error:", err));

// ================= AUTH =================
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
      plan: "free"
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      success: true,
      token,
      user: { email: user.email, plan: user.plan }
    });

  } catch (err) {
    console.log("SIGNUP ERROR:", err);
    res.json({ success: false, message: "Signup failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "No user found" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.json({ success: false, message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      success: true,
      token,
      user: { email: user.email, plan: user.plan }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.json({ success: false, message: "Login failed" });
  }
});

// ================= USER =================
app.get("/api/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    res.json({
      email: user.email,
      plan: user.plan
    });

  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ================= ODDS FIXED =================
const SPORTS = [
  "basketball_nba",
  "americanfootball_nfl",
  "baseball_mlb"
];

const fetchSportOdds = async (sport) => {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`;

    const res = await fetch(url);
    const data = await res.json();

    // 🔥 FIX: prevent crash
    if (!Array.isArray(data)) {
      console.log("❌ ODDS API BAD RESPONSE:", data);
      return [];
    }

    return data;

  } catch (err) {
    console.log("❌ FETCH ERROR:", err);
    return [];
  }
};

const getBestOdds = (bookmakers) => {
  let best = null;

  bookmakers.forEach((book) => {
    const market = book.markets?.[0];
    if (!market) return;

    market.outcomes.forEach((o) => {
      if (!best || o.price > best.price) {
        best = {
          price: o.price,
          book: book.title,
        };
      }
    });
  });

  return best;
};

app.get("/api/data", async (req, res) => {
  try {
    let allGames = [];
    let id = 1;

    for (const sport of SPORTS) {
      const data = await fetchSportOdds(sport);

      if (!Array.isArray(data)) continue;

      data.forEach((game) => {
        const best = getBestOdds(game.bookmakers || []);

        if (!best) return;

        allGames.push({
          id: id++,
          sport,
          away: game.away_team,
          home: game.home_team,
          odds: best.price,
          book: best.book
        });
      });
    }

    res.json({ success: true, games: allGames });

  } catch (err) {
    console.log("ODDS ERROR:", err);

    res.json({
      success: true,
      games: []
    });
  }
});

// ================= STRIPE FIXED =================
app.post("/api/checkout", async (req, res) => {
  try {
    console.log("🚀 CHECKOUT HIT");

    const { token } = req.body;

    if (!token) return res.json({ error: "No token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.json({ error: "User not found" });

    console.log("👤 USER:", user.email);
    console.log("💰 PRICE ID:", process.env.STRIPE_PRICE_ID);

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

    console.log("✅ STRIPE SESSION CREATED");

    res.json({ url: session.url });

  } catch (err) {
    console.log("🔥 CHECKOUT ERROR:", err.message);
    res.json({ error: err.message });
  }
});

// ================= HEALTH =================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ================= START =================
app.listen(PORT, () => {
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});