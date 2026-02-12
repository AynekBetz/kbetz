// =============================
// KBetz™ Production Server
// =============================

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Required for ES modules static serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================
// Middleware
// =============================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =============================
// In-Memory Storage (Replace with DB later)
// =============================

let users = [];
let slips = [];

// =============================
// AUTH ROUTES
// =============================

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existingUser = users.find(u => u.email === email);
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: Date.now(),
      email,
      password: hashedPassword
    };

    users.push(user);

    res.json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ error: "Register failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user)
      return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Auth Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// =============================
// SLIP ROUTES
// =============================

// Save Slip
app.post("/api/slips", authenticate, (req, res) => {
  const slip = {
    id: Date.now(),
    userId: req.user.id,
    legs: req.body.legs,
    createdAt: new Date()
  };

  slips.push(slip);
  res.json(slip);
});

// Get My Slips
app.get("/api/slips", authenticate, (req, res) => {
  const userSlips = slips.filter(s => s.userId === req.user.id);
  res.json(userSlips);
});

// =============================
// ODDS API ROUTES
// =============================

// List Sports
app.get("/api/sports", async (req, res) => {
  try {
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey)
      return res.status(500).json({ error: "Missing ODDS_API_KEY" });

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`
    );

    const data = await response.json();

    if (!response.ok)
      return res.status(response.status).json(data);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Sports fetch failed" });
  }
});

// Get Odds (Dynamic Sport)
app.get("/api/odds", async (req, res) => {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    const sport = req.query.sport || "basketball_nba";

    if (!apiKey)
      return res.status(500).json({ error: "Missing ODDS_API_KEY" });

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&markets=h2h`
    );

    const data = await response.json();

    if (!response.ok)
      return res.status(response.status).json(data);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Odds fetch failed" });
  }
});

// =============================
// EV & Kelly Helper Route
// =============================

app.post("/api/calc", (req, res) => {
  const { odds, probability, bankroll } = req.body;

  const decimalOdds =
    odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;

  const ev = (probability * (decimalOdds - 1)) - (1 - probability);

  const kelly =
    ((decimalOdds - 1) * probability - (1 - probability)) /
    (decimalOdds - 1);

  const suggestedBet = bankroll * Math.max(0, kelly);

  res.json({
    ev,
    kelly,
    suggestedBet
  });
});

// =============================
// Default Route
// =============================

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =============================
// Start Server
// =============================

app.listen(PORT, () => {
  console.log(`✅ KBetz™ running on port ${PORT}`);
});
