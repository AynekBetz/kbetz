import express from "express";
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

// 🔌 DB CONNECT
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

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

// 📝 SIGNUP
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

// 🔐 LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

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

  } catch (err) {
    console.log(err);
    res.json({ error: "Server error" });
  }
});

// 👤 ME
app.get("/api/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.json({ error: "No token" });

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

  } catch (err) {
    res.json({ error: "Invalid token" });
  }
});

// 🎯 ODDS (FIXED + FALLBACK)
app.get("/api/data", async (req, res) => {
  try {
    console.log("=== /api/data HIT ===");

    const API_KEY = process.env.ODDS_API_KEY;

    if (!API_KEY) {
      console.log("NO API KEY → fallback");
      return res.json({
        source: "fallback-no-key",
        games: fallbackGames()
      });
    }

    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h`;

    const response = await fetch(url);

    const text = await response.text();

    console.log("STATUS:", response.status);
    console.log("RESPONSE:", text);

    // ❌ API FAIL → USE FALLBACK
    if (!response.ok) {
      console.log("API FAILED → fallback");

      return res.json({
        source: "fallback-api-failed",
        games: fallbackGames()
      });
    }

    const data = JSON.parse(text);

    const games = data.slice(0, 5).map((g, i) => ({
      id: i,
      home: g.home_team,
      away: g.away_team,
      odds: g.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || "LIVE"
    }));

    res.json({
      source: "real",
      games
    });

  } catch (err) {
    console.log("CRASH:", err);

    res.json({
      source: "fallback-error",
      games: fallbackGames()
    });
  }
});

// 🔥 SAFE FALLBACK FUNCTION
function fallbackGames() {
  return [
    { id: 1, home: "Lakers", away: "Warriors", odds: -110 },
    { id: 2, home: "Celtics", away: "Heat", odds: -105 }
  ];
}

// 🚀 START
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});