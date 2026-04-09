import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import User from "./models/User.js";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 10000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =========================
   🔥 DATABASE
========================= */
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("🔥 MongoDB Connected");
});

/* =========================
   🔥 DEBUG
========================= */
app.get("/test", (req, res) => {
  res.send("SERVER LIVE");
});

/* =========================
   🔥 LIVE ODDS (NBA + MLB)
========================= */
app.get("/api/odds", async (req, res) => {
  try {
    console.log("📡 Fetching odds...");

    async function fetchSport(sport) {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=us&markets=h2h&apiKey=${process.env.ODDS_API_KEY}`
      );
      const data = await response.json();
      console.log(`📊 ${sport}:`, data?.length);
      return data;
    }

    // 🏀 NBA first
    let data = await fetchSport("basketball_nba");

    // ⚾ fallback MLB
    if (!Array.isArray(data) || data.length === 0) {
      console.log("⚠️ NBA empty → MLB fallback");
      data = await fetchSport("baseball_mlb");
    }

    // ❌ still empty
    if (!Array.isArray(data) || data.length === 0) {
      return res.json([
        {
          team: "No Live Games Right Now",
          home: "Try again later",
          away: "Sports update daily",
          bestHome: { odds: "-", book: "-" },
          bestAway: { odds: "-", book: "-" }
        }
      ]);
    }

    const formatted = data.map((game) => {
      let bestHome = { odds: -999, book: "" };
      let bestAway = { odds: -999, book: "" };

      game.bookmakers?.forEach((b) => {
        const market = b.markets?.find((m) => m.key === "h2h");
        if (!market) return;

        market.outcomes.forEach((o) => {
          if (o.name === game.home_team && o.price > bestHome.odds) {
            bestHome = { odds: o.price, book: b.title };
          }

          if (o.name === game.away_team && o.price > bestAway.odds) {
            bestAway = { odds: o.price, book: b.title };
          }
        });
      });

      return {
        team: `${game.away_team} vs ${game.home_team}`,
        home: game.home_team,
        away: game.away_team,
        bestHome,
        bestAway
      };
    });

    res.json(formatted);
  } catch (err) {
    console.log("❌ ODDS ERROR:", err);

    res.json([
      {
        team: "API ERROR",
        home: "Check API key",
        away: "Check logs",
        bestHome: { odds: "-", book: "-" },
        bestAway: { odds: "-", book: "-" }
      }
    ]);
  }
});

/* =========================
   🔐 AUTH
========================= */
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ email, password: hashed, pro: false });

  res.json({ message: "User created" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid login" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid login" });

  const token = jwt.sign(
    { id: user._id, email: user.email, pro: user.pro },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

app.get("/api/auth/me", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(PORT, () => {
  console.log("🔥 SERVER RUNNING ON PORT " + PORT);
});