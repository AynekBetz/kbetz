mport express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

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
console.log("=== /api/data HIT ===");

const API_KEY = process.env.ODDS_API_KEY;

if (!API_KEY) {
  console.log("NO ODDS_API_KEY → USING DEMO");

  return res.json({
    source: "demo-no-key",
    games: [
      { id: 1, home: "Warriors", away: "Lakers", odds: "-120 (Demo)" },
      { id: 2, home: "Heat", away: "Celtics", odds: "+105 (Demo)" }
    ]
  });
}

console.log("FETCHING REAL ODDS...");

const url = "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=" + API_KEY + "&regions=us&markets=h2h";

const response = await fetch(url);

if (!response.ok) {
  console.log("ODDS API FAILED:", response.status);

  return res.json({
    source: "api-failed",
    games: []
  });
}

const data = await response.json();

console.log("ODDS SUCCESS:", data.length);

const games = data.slice(0, 5).map((g, i) => ({
  id: i,
  home: g.home_team,
  away: g.away_team,
  odds: "LIVE"
}));

res.json({
  source: "real",
  games
});

} catch (err) {
console.log("CRASH:", err);

res.json({
  source: "error",
  games: []
});

}
});

app.listen(PORT, () => {
console.log("Server running on port " + PORT);
});