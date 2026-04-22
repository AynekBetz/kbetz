import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import Stripe from "stripe";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Disable buffering
mongoose.set("bufferCommands", false);

// 🔌 CONNECT DB
async function connectDB() {
try {
await mongoose.connect(process.env.MONGO_URI, {
serverSelectionTimeoutMS: 5000,
socketTimeoutMS: 45000
});
console.log("MongoDB Connected");
} catch (err) {
console.error("MongoDB Error:", err.message);
process.exit(1);
}
}

// 👤 USER MODEL
const UserSchema = new mongoose.Schema({
email: String,
password: String,
plan: { type: String, default: "free" }
});

const User = mongoose.model("User", UserSchema);

// ❤️ HEALTH
app.get("/api/health", (req, res) => {
res.json({ status: "OK" });
});

// 📝 SIGNUP (WITH FULL DEBUG)
app.post("/api/signup", async (req, res) => {
try {
const { email, password } = req.body;

```
console.log("SIGNUP REQUEST:", email);

if (!email || !password) {
  return res.json({
    success: false,
    message: "Missing email or password"
  });
}

const existing = await User.findOne({ email });
if (existing) {
  return res.json({
    success: false,
    message: "User exists"
  });
}

const hashed = await bcrypt.hash(password, 10);

const user = await User.create({
  email,
  password: hashed,
  plan: "free"
});

console.log("USER CREATED:", user.email);

res.json({ success: true });
```

} catch (err) {
console.error("🔥 SIGNUP ERROR FULL:", err);

```
res.json({
  success: false,
  message: err.message
});
```

}
});

// 🔐 LOGIN
app.post("/api/login", async (req, res) => {
try {
const { email, password } = req.body;

```
const user = await User.findOne({ email });
if (!user) return res.json({ error: "Invalid login" });

const valid = await bcrypt.compare(password, user.password);
if (!valid) return res.json({ error: "Invalid login" });

const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET || "secret123"
);

res.json({
  success: true,
  token,
  user: {
    email: user.email,
    plan: user.plan
  }
});
```

} catch (err) {
console.error("LOGIN ERROR:", err.message);
res.json({ error: "Server error" });
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

// 📡 DATA
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

// 💳 STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/api/checkout", async (req, res) => {
try {
const token = req.body.token;

```
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
console.error("STRIPE ERROR:", err.message);
res.status(500).json({ error: "Checkout failed" });
}
});

// 🚀 START SERVER
async function start() {
await connectDB();

app.listen(PORT, () => {
console.log("Server running on port " + PORT);
});
}

start();
