import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

const app = express();

// 🔥 REQUIRED FOR STRIPE WEBHOOK (raw body)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

const PORT = 10000;

// 🔐 STRIPE INIT
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 CONNECT MONGODB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("🔥 MongoDB Connected");
});

/* =========================
   🔐 SIGNUP
========================= */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "User exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashed,
      pro: false
    });

    res.json({ message: "User created" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* =========================
   🔐 LOGIN
========================= */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid login" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid login" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        pro: user.pro
      },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* =========================
   🔐 GET CURRENT USER  ✅ THIS IS YOUR MISSING ROUTE
========================= */
app.get("/api/auth/me", async (req, res) => {
  const token = req.headers.authorization;

  // 🔥 NO TOKEN
  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    // 🔥 VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 FIND USER IN DB
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      email: user.email,
      pro: user.pro,
      stripeCustomerId: user.stripeCustomerId || null
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

/* =========================
   💳 ENSURE STRIPE CUSTOMER
========================= */
async function ensureStripeCustomer(user) {
  if (user.stripeCustomerId) return user;

  const customer = await stripe.customers.create({
    email: user.email
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return user;
}

/* =========================
   💳 CREATE CHECKOUT SESSION
========================= */
app.post("/api/stripe/create-checkout", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id);

    user = await ensureStripeCustomer(user);

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url:
        "https://kbetz-frontend.vercel.app/dashboard?success=true",
      cancel_url:
        "https://kbetz-frontend.vercel.app/dashboard"
    });

    res.json({ url: session.url });
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

/* =========================
   💰 STRIPE WEBHOOK
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
  } catch (err) {
    console.log("Webhook error:", err.message);
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const customerId = session.customer;

    const user = await User.findOne({
      stripeCustomerId: customerId
    });

    if (user) {
      user.pro = true;
      await user.save();

      console.log("🔥 USER UPGRADED:", user.email);
    }
  }

  res.json({ received: true });
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🔥 SERVER RUNNING ON PORT ${PORT}`);
});