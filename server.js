import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import User from "./models/User.js";

dotenv.config();

const app = express();

// ================= STRIPE WEBHOOK (RAW BODY FIRST) =================
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
    console.log("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const obj = event.data.object;

  // ✅ UPGRADE
  if (event.type === "checkout.session.completed") {
    const email = obj.customer_email;
    console.log("💰 UPGRADE:", email);

    await User.findOneAndUpdate(
      { email },
      { plan: "pro" }
    );
  }

  // ❌ DOWNGRADE
  if (
    event.type === "invoice.payment_failed" ||
    event.type === "customer.subscription.deleted"
  ) {
    const email = obj.customer_email;
    console.log("❌ DOWNGRADE:", email);

    await User.findOneAndUpdate(
      { email },
      { plan: "free" }
    );
  }

  res.json({ received: true });
});

// ================= NORMAL MIDDLEWARE =================
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.log("❌ Mongo error:", err));

// ================= AUTH =================

// 🔥 FIXED SIGNUP (WITH DEBUG LOGGING)
app.post("/api/signup", async (req, res) => {
  try {
    console.log("📩 SIGNUP BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing fields");
      return res.json({ success: false, message: "Missing fields" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      console.log("❌ User already exists");
      return res.json({ success: false, message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
      plan: "free"
    });

    await user.save();

    console.log("✅ USER CREATED:", email);

    return res.json({ success: true });

  } catch (err) {
    console.log("🔥 SIGNUP ERROR:", err);
    return res.json({ success: false, message: err.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ No user found");
      return res.json({ success: false, message: "No user found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("❌ Wrong password");
      return res.json({ success: false, message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      success: true,
      token,
      user: {
        email: user.email,
        plan: user.plan
      }
    });

  } catch (err) {
    console.log("🔥 LOGIN ERROR:", err);
    res.json({ success: false });
  }
});

// GET USER
app.get("/api/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token" });
    }

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

// ================= MULTI-SPORT + LINE SHOPPING =================

const SPORTS = [
  "basketball_nba",
  "americanfootball_nfl",
  "baseball_mlb"
];

const fetchSportOdds = async (sport) => {
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`;

  const res = await fetch(url);
  const data = await res.json();

  return data;
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

      data.forEach((game) => {
        const best = getBestOdds(game.bookmakers);

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
    console.log("🔥 ODDS ERROR:", err);

    res.json({
      success: true,
      games: [
        {
          id: 1,
          sport: "fallback",
          away: "Fallback Team",
          home: "Fallback Opponent",
          odds: -110,
          book: "Mock"
        }
      ]
    });
  }
});

// ================= STRIPE CHECKOUT =================
app.post("/api/checkout", async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

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

    res.json({ url: session.url });

  } catch (err) {
    console.log("🔥 STRIPE ERROR:", err);
    res.json({ error: "Stripe failed" });
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