import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_SECRET_KEY);

/* ===========================
   MongoDB Connection
=========================== */

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

/* ===========================
   Schemas
=========================== */

const userSchema = new mongoose.Schema({
  email: String,
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

const User = mongoose.model("User", userSchema);
const Bet = mongoose.model("Bet", betSchema);

/* ===========================
   Auth Middleware
=========================== */

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ===========================
   Health
=========================== */

app.get("/api/health", (req, res) => {
  res.json({ status: "Healthy" });
});

/* ===========================
   Register
=========================== */

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed
  });

  res.json({ message: "User created" });
});

/* ===========================
   Login
=========================== */

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);

  res.json({ token });
});

/* ===========================
   Bankroll
=========================== */

app.post("/api/bankroll", auth, async (req, res) => {
  const { amount } = req.body;

  const user = await User.findById(req.user.id);
  user.bankroll = amount;
  await user.save();

  res.json({ bankroll: user.bankroll });
});

/* ===========================
   Add Bet
=========================== */

app.post("/api/bet", auth, async (req, res) => {
  const { sport, market, odds, stake } = req.body;

  const bet = await Bet.create({
    userId: req.user.id,
    sport,
    market,
    odds,
    stake
  });

  res.json(bet);
});

/* ===========================
   Stripe Subscription
=========================== */

app.post("/api/create-checkout-session", auth, async (req, res) => {
  const session = await stripe.checkout.sessions.create({
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
});

/* ===========================
   Sports Route
=========================== */

app.get("/api/sports", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}`
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
