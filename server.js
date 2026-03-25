import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "./models/User.js";

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
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || "").replace(/\s+/g, "").trim());

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
   GET USER (CRITICAL)
========================= */
app.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
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
   STRIPE WEBHOOK (UNLOCK PRO)
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
   PROTECTED ROUTE
========================= */
app.get("/pro-data", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user.plan !== "pro") {
    return res.status(403).json({ error: "Upgrade required" });
  }

  res.json({ message: "🔥 PRO ACCESS GRANTED" });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`🚀 KBETZ running on ${PORT}`);
});