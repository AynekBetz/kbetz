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

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
email: String,
password: String,
plan: { type: String, default: "free" }
});

const User = mongoose.model("User", UserSchema);

app.get("/api/health", (req, res) => {
res.json({ status: "OK" });
});

app.post("/api/signup", async (req, res) => {
try {
const { email, password } = req.body;
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
res.json({ success: true });
} catch (err) {
console.log(err);
res.json({ success: false });
}
});

app.post("/api/login", async (req, res) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user) {
return res.json({ error: "Invalid login" });
}
const valid = await bcrypt.compare(password, user.password);
if (!valid) {
return res.json({ error: "Invalid login" });
}
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
} catch (err) {
console.log(err);
res.json({ error: "Server error" });
}
});

app.get("/api/me", async (req, res) => {
try {
const auth = req.headers.authorization;
if (!auth) {
return res.json({ error: "No token" });
}
const token = auth.split(" ")[1];
const decoded = jwt.verify(
token,
process.env.JWT_SECRET || "secret123"
);
const user = await User.findById(decoded.id);
if (!user) {
return res.json({ error: "User not found" });
}
res.json({
email: user.email,
plan: user.plan
});
} catch (err) {
res.json({ error: "Invalid token" });
}
});

app.get("/api/data", async (req, res) => {
try {
const API_KEY = process.env.ODDS_API_KEY;

if (!API_KEY) {
return res.json({ source: "demo", games: [] });
}

const url = "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=" + API_KEY + "&regions=us&markets=h2h";

const response = await fetch(url);

if (!response.ok) {
return res.json({ source: "api-failed", games: [] });
}

const data = await response.json();

const games = data.slice(0, 5).map((g, i) => ({
id: i,
home: g.home_team,
away: g.away_team,
odds: "LIVE"
}));

res.json({ source: "real", games });

} catch (err) {
res.json({ source: "error", games: [] });
}
});

// 🔥 STRIPE CHECKOUT
app.post("/api/checkout", async (req, res) => {
try {
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
payment_method_types: ["card"],
mode: "subscription",
line_items: [
{
price: process.env.STRIPE_PRICE_ID,
quantity: 1
}
],
success_url: "https://kbetz.vercel.app/dashboard?upgrade=success",
cancel_url: "https://kbetz.vercel.app/dashboard"
});

res.json({ url: session.url });

} catch (err) {
console.log("STRIPE ERROR:", err);
res.status(500).json({ error: "Stripe failed" });
}
});

// 🔥 UPGRADE USER TO PRO
app.post("/api/upgrade", async (req, res) => {
try {
const token = req.headers.authorization.split(" ")[1];

const decoded = jwt.verify(
token,
process.env.JWT_SECRET || "secret123"
);

await User.findByIdAndUpdate(decoded.id, {
plan: "pro"
});

res.json({ success: true });

} catch (err) {
res.json({ error: "Upgrade failed" });
}
});

app.listen(PORT, () => {
console.log("Server running on port " + PORT);
});
