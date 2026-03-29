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

// ✅ CONNECT DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// ✅ STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log("✅ Stripe loaded");

// 🔥 WEBHOOK (FAST + SAFE)
app.post(["/webhook", "/webhook/"], express.raw({ type: "*/*" }), (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  res.status(200).send("ok");

  setImmediate(async () => {
    try {
      const event = JSON.parse(req.body.toString());

      console.log("📦 Event:", event.type);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const email = session.customer_email;

        console.log("💰 Payment from:", email);

        let user = await User.findOne({ email });

        if (user) {
          user.plan = "pro";
          user.stripeCustomerId = session.customer;
          user.stripeSubscriptionId = session.subscription;

          await user.save();

          console.log("✅ USER UPGRADED:", email);
        } else {
          console.log("⚠️ No user found for email:", email);
        }
      }
    } catch (err) {
      console.log("❌ Webhook error:", err.message);
    }
  });
});

// ✅ NORMAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// 🔐 SIGNUP (NO DUPLICATES)
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({ email, password: hashed });
  await user.save();

  res.json({ message: "User created" });
});

// 🔐 LOGIN
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

// 🔐 AUTH MIDDLEWARE
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

// 🔐 GET CURRENT USER (SECURE)
app.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ user });
});

// ✅ HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "ok", connected: true });
});

// 🚀 START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});