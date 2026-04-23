import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

dotenv.config();

console.log("🚀 NEW VERSION DEPLOYED");

const app = express();

// ✅ FORCE CORS (NO BLOCKING EVER)
app.use((req, res, next) => {
res.header("Access-Control-Allow-Origin", "*");
res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

if (req.method === "OPTIONS") {
return res.sendStatus(200);
}

next();
});

app.use(express.json());

const PORT = process.env.PORT || 10000;

// Prevent mongoose hanging
mongoose.set("bufferCommands", false);

// 🔌 CONNECT DB
async function connectDB() {
try {
await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB Connected");
} catch (err) {
console.error("MongoDB Error:", err.message);
}
}

// 👤 MODEL
const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
email: String,
password: String,
plan: { type: String, default: "free" }
}));

// ❤️ HEALTH
app.get("/api/health", (req, res) => {
res.json({ status: "OK" });
});

// 🔥 SIGNUP
app.post("/api/signup", async (req, res) => {
console.log("🔥 SIGNUP HIT");

try {
const { email, password } = req.body || {};

```
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

console.log("✅ USER CREATED");

return res.json({ success: true });
```

} catch (err) {
console.log("🔥 SIGNUP ERROR:", err);
return res.json({ success: false, message: err.message });
}
});

// 🔐 LOGIN (FULLY SAFE)
app.post("/api/login", async (req, res) => {
console.log("🔥 LOGIN HIT");

try {
const { email, password } = req.body || {};

```
if (!email || !password) {
  return res.json({ error: "Missing credentials" });
}

let user;
try {
  user = await User.findOne({ email });
} catch (err) {
  console.log("❌ DB ERROR:", err);
  return res.json({ error: "Database error" });
}

if (!user) {
  return res.json({ error: "Invalid login - no user" });
}

let valid = false;
try {
  valid = await bcrypt.compare(password, user.password);
} catch (err) {
  console.log("❌ BCRYPT ERROR:", err);
  return res.json({ error: "Password compare failed" });
}

if (!valid) {
  return res.json({ error: "Invalid login - wrong password" });
}

let token;
try {
  token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "secret123"
  );
} catch (err) {
  console.log("❌ JWT ERROR:", err);
  return res.json({ error: "Token generation failed" });
}

console.log("✅ LOGIN SUCCESS");

return res.json({
  success: true,
  token,
  user: {
    email: user.email,
    plan: user.plan
  }
});
```

} catch (err) {
console.log("🔥 LOGIN CRASH:", err);
return res.json({ error: "Unknown login crash" });
}
});

// 👤 ME
app.get("/api/me", async (req, res) => {
try {
const auth = req.headers.authorization;
if (!auth) return res.json({ error: "No token" });

```
const token = auth.split(" ")[1];

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET || "secret123"
);

const user = await User.findById(decoded.id);
if (!user) return res.json({ error: "User not found" });

res.json({
  email: user.email,
  plan: user.plan
});
```

} catch {
res.json({ error: "Invalid token" });
}
});

// 📡 DATA (uses built-in fetch)
app.get("/api/data", async (req, res) => {
try {
const API_KEY = process.env.ODDS_API_KEY;

```
if (!API_KEY) throw new Error("No API key");

const response = await fetch(
  "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=" +
  API_KEY +
  "&regions=us&markets=h2h"
);

if (!response.ok) throw new Error("API failed");

const data = await response.json();

const games = data.slice(0, 5).map((g, i) => ({
  id: i,
  home: g.home_team,
  away: g.away_team,
  odds:
    g.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || -110
}));

res.json({ source: "real", games });
```

} catch (err) {
console.error("DATA ERROR:", err.message);

```
res.json({
  source: "fallback",
  games: [
    { id: 1, home: "Lakers", away: "Warriors", odds: -110 },
    { id: 2, home: "Celtics", away: "Heat", odds: -105 }
  ]
});
```

}
});

// 💳 STRIPE (SAFE INIT)
let stripe;
try {
stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (e) {
console.log("Stripe disabled:", e.message);
}

app.post("/api/checkout", async (req, res) => {
try {
if (!stripe) {
return res.json({ error: "Stripe not configured" });
}

```
const token = req.body.token;

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET || "secret123"
);

const user = await User.findById(decoded.id);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "subscription",
  line_items: [
    {
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1
    }
  ],
  success_url:
    "https://kbetz-frontend.vercel.app/dashboard?upgrade=success",
  cancel_url:
    "https://kbetz-frontend.vercel.app/dashboard",
  customer_email: user.email
});

res.json({ url: session.url });
```

} catch (err) {
console.error("STRIPE ERROR:", err);
res.json({ error: "Checkout failed" });
}
});

// 🚀 START
async function start() {
await connectDB();

app.listen(PORT, () => {
console.log("Server running on port " + PORT);
});
}

start();
