// server.js — Phase B: Pro vs Free gating

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

// --- MOCK USER STORE (safe for now) ---
const users = {}; // email -> { plan }

// --- AUTH MIDDLEWARE ---
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
}

function requirePro(req, res, next) {
  const user = users[req.user.email];
  if (!user || user.plan !== "pro") {
    return res.status(403).json({ error: "Pro feature" });
  }
  next();
}

// --- LOGIN / REGISTER ---
app.post("/api/login", (req, res) => {
  const { email } = req.body;
  if (!users[email]) users[email] = { plan: "free" };

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, plan: users[email].plan });
});

// --- UPGRADE TO PRO (Stripe-ready later) ---
app.post("/api/upgrade", requireAuth, (req, res) => {
  users[req.user.email].plan = "pro";
  res.json({ success: true });
});

// --- BASIC ANALYSIS (FREE OK) ---
app.post("/api/analyze", (req, res) => {
  const { ev } = req.body;
  res.json({ ev, message: "Basic analysis complete" });
});

// --- PRO-ONLY: HEDGE ALERT ---
app.post("/api/hedge-check", requireAuth, requirePro, (req, res) => {
  const { ev } = req.body;
  const alert = ev < -0.03;
  res.json({
    hedge: alert,
    message: alert ? "⚠️ Hedge recommended" : "No hedge needed",
  });
});

app.listen(PORT, () =>
  console.log(`✅ KBetz™ Phase B running on port ${PORT}`)
);
