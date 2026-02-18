import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fetch from "node-fetch";
import Stripe from "stripe";

import { calculateKelly } from "./utils/kelly.js";
import { calculateHedge } from "./utils/hedge.js";
import { calculateEV } from "./utils/ev.js";

const app = express();

/* ===============================
   ENV VARIABLES
================================= */

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

/* ===============================
   MIDDLEWARE
================================= */

app.use(cors());
app.use(express.json());

/* ===============================
   DATABASE CONNECTION
================================= */

if (MONGO_URI && MONGO_URI.startsWith("mongodb")) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err.message));
} else {
  console.log("⚠️ MongoDB not connected — check MONGO_URI");
}

/* ===============================
   USER MODEL
================================= */

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

/* ===============================
   AUTH ROUTES
================================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ===============================
   HEALTH CHECK
================================= */

app.get("/api/health", (req, res) => {
  res.json({ status: "Healthy" });
});

/* ===============================
   SPORTS ROUTE (ODDS API)
================================= */

app.get("/api/sports", async (req, res) => {
  try {
    if (!ODDS_API_KEY) {
      return res.status(500).json({ error: "Missing ODDS_API_KEY" });
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}`
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

/* ===============================
   KELLY CALCULATOR
================================= */

app.post("/api/kelly", (req, res) => {
  try {
    const { probability, odds, bankroll } = req.body;

    const result = calculateKelly(probability, odds, bankroll);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ===============================
   HEDGE CALCULATOR
================================= */

app.post("/api/hedge", (req, res) => {
  try {
    const { stake1, odds1, odds2 } = req.body;

    const result = calculateHedge(stake1, odds1, odds2);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ===============================
   EXPECTED VALUE
================================= */

app.post("/api/ev", (req, res) => {
  try {
    const { probability, odds, stake } = req.body;

    const result = calculateEV(probability, odds, stake);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ===============================
   STRIPE (OPTIONAL PAYMENTS)
================================= */

if (STRIPE_SECRET_KEY) {
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "KBetz Premium"
              },
              unit_amount: 1999
            },
            quantity: 1
          }
        ],
        mode: "payment",
        success_url: "https://kbetz.onrender.com/success",
        cancel_url: "https://kbetz.onrender.com/cancel"
      });

      res.json({ url: session.url });
    } catch (err) {
      res.status(500).json({ error: "Stripe session failed" });
    }
  });
}

/* ===============================
   START SERVER
================================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
