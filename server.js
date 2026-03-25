import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import User from "./models/User.js";
import Bet from "./models/Bet.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* =========================
   DB CONNECT
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB error:", err));

/* =========================
   STRIPE (CLEAN KEY FIX)
========================= */
const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY || "").replace(/\s+/g, "").trim()
);

/* =========================
   AUTH MIDDLEWARE
========================= */
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.send("KBETZ LIVE ✅");
});

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token });
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token });
});

/* =========================
   GET USER
========================= */
app.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});

/* =========================
   ODDS
========================= */
app.get("/odds", (req, res) => {
  res.json([
    {
      home_team: "Lakers",
      away_team: "Warriors",
      odds: [-120, 105],
    },
    {
      home_team: "Celtics",
      away_team: "Bucks",
      odds: [-140, 120],
    },
  ]);
});

/* =========================
   STRIPE CHECKOUT
========================= */
app.post("/create-checkout-session", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  const customer = await stripe.customers.create({
    email: user.email,
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "KBETZ Pro" },
          unit_amount: 500,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/dashboard`,
  });

  res.json({ url: session.url });
});

/* =========================
   STRIPE WEBHOOK
========================= */
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const user = await User.findOne({
      stripeCustomerId: session.customer,
    });

    if (user) {
      user.plan = "pro";
      await user.save();
      console.log("🔥 USER UPGRADED TO PRO");
    }
  }

  res.json({ received: true });
});

/* =========================
   ADD BET
========================= */
app.post("/add-bet", auth, async (req, res) => {
  const { stake, odds, result } = req.body;

  let profit = result === "win"
    ? stake * (odds / 100)
    : -stake;

  const bet = await Bet.create({
    userId: req.user.id,
    stake,
    odds,
    result,
    profit,
  });

  res.json(bet);
});

/* =========================
   STATS
========================= */
app.get("/stats", auth, async (req, res) => {
  const bets = await Bet.find({ userId: req.user.id });

  const totalBets = bets.length;
  const wins = bets.filter(b => b.result === "win").length;
  const losses = bets.filter(b => b.result === "loss").length;

  const totalProfit = bets.reduce((sum, b) => sum + b.profit, 0);
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);

  const roi = totalStaked ? (totalProfit / totalStaked) * 100 : 0;

  res.json({
    totalBets,
    wins,
    losses,
    totalProfit,
    roi,
  });
});

/* =========================
   BET HISTORY
========================= */
app.get("/bets", auth, async (req, res) => {
  const bets = await Bet.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(bets);
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`🚀 KBETZ running on ${PORT}`);
});