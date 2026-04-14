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

// Stripe webhook MUST be raw
app.use("/api/webhook", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.log(err));

// ================= AUTH =================

// SIGNUP
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
    });

    await user.save();

    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ success: false });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ success: false });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);

  res.json({
    success: true,
    token,
    user: {
      email: user.email,
      plan: user.plan,
    }
  });
});

// GET USER
app.get("/api/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);

    res.json({
      email: user.email,
      plan: user.plan,
    });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// ================= STRIPE =================

// CREATE CHECKOUT
app.post("/api/checkout", async (req, res) => {
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
});

// WEBHOOK
app.post("/api/webhook", async (req, res) => {
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

    const user = await User.findOne({
      email: session.customer_email,
    });

    if (user) {
      user.plan = "pro";
      await user.save();
    }
  }

  res.sendStatus(200);
});

// TEST DATA
app.get("/api/data", (req, res) => {
  res.json({
    success: true,
    games: [
      { id: 1, away: "Warriors", home: "Lakers", odds: -110 },
      { id: 2, away: "Heat", home: "Celtics", odds: -130 },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🔥 SERVER RUNNING ON ${PORT}`);
});