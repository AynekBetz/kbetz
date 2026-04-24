import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import fetch from "node-fetch"; // 🔥 FIXED CRASH

dotenv.config();

console.log("🚀 KBETZ STABLE SERVER STARTING");

const app = express();

/* =========================
🔥 CORS (PHONE + VERCEL FIX)
========================= */
app.use((req, res, next) => {
const allowedOrigins = [
"http://localhost:3000",
"https://kbetz-frontend.vercel.app"
];

const origin = req.headers.origin;

if (allowedOrigins.includes(origin)) {
res.setHeader("Access-Control-Allow-Origin", origin);
} else {
res.setHeader("Access-Control-Allow-Origin", "*");
}

res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

if (req.method === "OPTIONS") {
return res.sendStatus(200);
}

next();
});

app.use(express.json());

const PORT = process.env.PORT || 10000;

/* =========================
✅ DATABASE
========================= */
mongoose.set("bufferCommands", false);

async function connectDB() {
try {
await mongoose.connect(process.env.MONGO_URI);
console.log("✅ MongoDB Connected");
} catch (err) {
console.error("❌ MongoDB Error:", err.message);
}
}

/* =========================
✅ MODEL
========================= */
const User =
mongoose.models.User ||
mongoose.model(
"User",
new mongoose.Schema({
email: String,
password: String,
plan: { type: String, default: "free" }
})
);

/* =========================
✅ HEALTH
========================= */
app.get("/api/health", (req, res) => {
res.json({ status: "OK" });
});

/* =========================
✅ SIGNUP
========================= */
app.post("/api/signup", async (req, res) => {
try {
const { email, password } = req.body || {};


if (!email || !password) {
  return res.json({ success: false, message: "Missing email/password" });
}

const existing = await User.findOne({ email });

if (existing) {
  return res.json({ success: false, message: "User exists" });
}

const hashed = await bcrypt.hash(password, 10);

await User.create({
  email,
  password: hashed,
  plan: "free"
});

console.log("✅ USER CREATED:", email);

return res.json({ success: true });

} catch (err) {
console.log("❌ SIGNUP ERROR:", err);
return res.json({ success: false, message: err.message });
}
});

/* =========================
🔐 LOGIN
========================= */
app.post("/api/login", async (req, res) => {
try {
const { email, password } = req.body || {};


if (!email || !password) {
  return res.status(400).json({ error: "Missing credentials" });
}

const user = await User.findOne({ email });

if (!user) {
  return res.status(401).json({ error: "Invalid login" });
}

const valid = await bcrypt.compare(password, user.password);

if (!valid) {
  return res.status(401).json({ error: "Invalid login" });
}

const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET || "secret123",
  { expiresIn: "7d" }
);

console.log("✅ LOGIN SUCCESS:", email);

return res.json({
  success: true,
  token,
  user: {
    email: user.email,
    plan: user.plan
  }
});


} catch (err) {
console.log("❌ LOGIN ERROR:", err);
return res.status(500).json({ error: "Login failed" });
}
});

/* =========================
👤 ME
========================= */
app.get("/api/me", async (req, res) => {
try {
const auth = req.headers.authorization;
if (!auth) return res.status(401).json({ error: "No token" });


const token = auth.split(" ")[1];

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET || "secret123"
);

const user = await User.findById(decoded.id);
if (!user) return res.status(404).json({ error: "User not found" });

res.json({
  email: user.email,
  plan: user.plan
});


} catch {
res.status(401).json({ error: "Invalid token" });
}
});

/* =========================
📡 DATA (CRASH FIXED)
========================= */
app.get("/api/data", async (req, res) => {
try {
const API_KEY = process.env.ODDS_API_KEY;


if (!API_KEY) throw new Error("No API key");

if (typeof fetch !== "function") {
  throw new Error("fetch not available");
}

const response = await fetch(
  `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h`
);

const data = await response.json();

const games = data.slice(0, 5).map((g, i) => ({
  id: i,
  home: g.home_team,
  away: g.away_team,
  odds:
    g.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || -110
}));

res.json({ source: "real", games });


} catch (err) {
console.log("DATA ERROR:", err.message);


res.json({
  source: "fallback",
  games: [
    { id: 1, home: "Lakers", away: "Warriors", odds: -110 },
    { id: 2, home: "Celtics", away: "Heat", odds: -105 }
  ]
});


}
});

/* =========================
💳 STRIPE (SAFE)
========================= */
let stripe;

if (process.env.STRIPE_SECRET_KEY) {
try {
stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (err) {
console.log("Stripe init failed:", err.message);
}
} else {
console.log("Stripe not configured");
}

app.post("/api/checkout", async (req, res) => {
try {
if (!stripe) return res.json({ error: "Stripe not configured" });


const decoded = jwt.verify(
  req.body.token,
  process.env.JWT_SECRET || "secret123"
);

const user = await User.findById(decoded.id);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "subscription",
  line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
  success_url:
    "https://kbetz-frontend.vercel.app/dashboard?upgrade=success",
  cancel_url:
    "https://kbetz-frontend.vercel.app/dashboard",
  customer_email: user.email
});

res.json({ url: session.url });


} catch (err) {
console.log("STRIPE ERROR:", err);
res.json({ error: "Checkout failed" });
}
});

/* =========================
🚀 START
========================= */
async function start() {
await connectDB();

app.listen(PORT, () => {
console.log("🚀 Server running on port " + PORT);
});
}

start();
