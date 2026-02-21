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

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err.message));

/* USER MODEL */
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

/* AUTH */
app.post("/api/auth/register", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({
    email: req.body.email,
    password: hashed
  });
  res.json(user);
});

app.post("/api/auth/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  const valid = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (!valid)
    return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);

  res.json({ token });
});

/* SCANNER */
app.get("/api/scan", async (req, res) => {
  const response = await fetch(
    `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us&markets=h2h&apiKey=${ODDS_API_KEY}`
  );

  const data = await response.json();

  const evBets = scanForPositiveEV(data);
  const ranked = rankBets(evBets);

  res.json(ranked.slice(0, 20));
});

/* BANKROLL */
app.post("/api/bet", async (req, res) => {
  const bet = await Bet.create(req.body);
  res.json(bet);
});

app.get("/api/bankroll", async (req, res) => {
  const bets = await Bet.find();

  let profit = 0;

  for (const bet of bets) {
    if (bet.result === "win") {
      profit += bet.stake;
    }
    if (bet.result === "loss") {
      profit -= bet.stake;
    }
  }

  res.json({
    totalBets: bets.length,
    profit
  });
});

/* CALCULATORS */
app.post("/api/kelly", (req, res) => {
  res.json(
    calculateKelly(
      req.body.probability,
      req.body.odds,
      req.body.bankroll
    )
  );
});

app.post("/api/hedge", (req, res) => {
  res.json(
    calculateHedge(
      req.body.stake1,
      req.body.odds1,
      req.body.odds2
    )
  );
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);