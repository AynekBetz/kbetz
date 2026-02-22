import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fetch from "node-fetch";

import Bet from "./models/Bet.js";

import { calculateKelly } from "./utils/kelly.js";
import { calculateHedge } from "./utils/hedge.js";
import { calculateEV } from "./utils/ev.js";
import { scanForPositiveEV } from "./utils/evScanner.js";
import { rankBets } from "./utils/ranking.js";
import { detectSharpLine } from "./utils/sharpDetector.js";

const app = express();

/* ==============================
   ENV VARIABLES
============================== */

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const ODDS_API_KEY = process.env.ODDS_API_KEY;

/* ==============================
   MIDDLEWARE
============================== */

app.use(cors());
app.use(express.json());

/* ==============================
   DATABASE CONNECTION
============================== */

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err.message));

/* ==============================
   HEALTH ROUTE
============================== */

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    mongo:
      mongoose.connection.readyState === 1
        ? "connected"
        : "not connected"
  });
});

/* ==============================
   USER MODEL
============================== */

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  tier: {
    type: String,
    enum: ["free", "pro", "elite"],
    default: "free"
  }
});

const User = mongoose.model("User", userSchema);

/* ==============================
   AUTH ROUTES
============================== */

app.post("/api/auth/register", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      email: req.body.email,
      password: hashed
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email
    });

    if (!user)
      return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!valid)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ==============================
   EV SCANNER
============================== */

app.get("/api/scan", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h&apiKey=${ODDS_API_KEY}`
    );

    const data = await response.json();

    const evBets = scanForPositiveEV(data);
    const ranked = rankBets(evBets);

    res.json(ranked.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: "Scanner failed" });
  }
});

/* ==============================
   BANKROLL ROUTES
============================== */

app.post("/api/bet", async (req, res) => {
  try {
    const bet = await Bet.create(req.body);
    res.json(bet);
  } catch (err) {
    res.status(500).json({ error: "Bet save failed" });
  }
});

app.get("/api/bankroll", async (req, res) => {
  try {
    const bets = await Bet.find();

    let profit = 0;

    for (const bet of bets) {
      if (bet.result === "win") {
        if (bet.odds > 0)
          profit += bet.stake * (bet.odds / 100);
        else
          profit += bet.stake * (100 / Math.abs(bet.odds));
      }

      if (bet.result === "loss") {
        profit -= bet.stake;
      }
    }

    res.json({
      totalBets: bets.length,
      profit
    });
  } catch (err) {
    res.status(500).json({ error: "Bankroll fetch failed" });
  }
});

/* ==============================
   CALCULATORS
============================== */

app.post("/api/kelly", (req, res) => {
  try {
    const result = calculateKelly(
      req.body.probability,
      req.body.odds,
      req.body.bankroll
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/hedge", (req, res) => {
  try {
    const result = calculateHedge(
      req.body.stake1,
      req.body.odds1,
      req.body.odds2
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ==============================
   ROOT ROUTE
============================== */

app.get("/", (req, res) => {
  res.json({
    message: "KBetz API is live 🚀",
    version: "6.0.0"
  });
});

/* ==============================
   START SERVER
============================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});