import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

import { calculateKelly } from "./utils/kelly.js";
import { calculateHedge } from "./utils/hedge.js";
import { calculateEV } from "./utils/ev.js";

const app = express();

app.use(cors());
app.use(express.json());

/* ================================
   ENVIRONMENT VARIABLES
================================ */

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

/* ================================
   MONGODB CONNECTION
================================ */

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) =>
      console.error("❌ MongoDB Error:", err.message)
    );
}

/* ================================
   USER MODEL
================================ */

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

/* ================================
   HEALTH ROUTES
================================ */

app.get("/", (req, res) => {
  res.json({ message: "KBetz API Running 🚀" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Healthy" });
});

/* ================================
   AUTH ROUTES
================================ */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================================
   ODDS API ROUTE
================================ */

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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

/* ================================
   KELLY CALCULATOR
================================ */

app.post("/api/kelly", (req, res) => {
  try {
    const { probability, odds } = req.body;

    const result = calculateKelly(probability, odds);

    res.json({ kellyFraction: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* ================================
   HEDGE CALCULATOR
================================ */

app.post("/api/hedge", (req, res) => {
  try {
    const { stake1, odds1, odds2 } = req.body;

    const result = calculateHedge(stake1, odds1, odds2);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* ================================
   EV CALCULATOR
================================ */

app.post("/api/ev", (req, res) => {
  try {
    const { probability, odds } = req.body;

    const result = calculateEV(probability, odds);

    res.json({ expectedValue: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* ================================
   START SERVER
================================ */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
