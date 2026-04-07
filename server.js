import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Stripe from "stripe";
import User from "./models/User.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 10000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 CONNECT DB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("🔥 MongoDB Connected");
});

/* =========================
   🔐 SIGNUP
========================= */
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "User exists" });

  const user = await User.create({
    email,
    password,
    pro: false
  });

  res.json(user);
});

/* =========================
   🔐 LOGIN
========================= */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) return res.status(401).json({ error: "Invalid login" });

  const token = jwt.sign(
    { id: user._id, email: user.email, pro: user.pro },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

/* =========================
   🔐 GET USER
========================= */
app.get("/api/auth/me", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

/* =========================
   💰 STRIPE WEBHOOK
========================= */
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook error:", err.message);
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;

    const user = await User.findOne({ email });

    if (user) {
      user.pro = true;
      await user.save();

      console.log("🔥 USER UPGRADED:", email);
    }
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log("🔥 SERVER RUNNING ON 10000");
});