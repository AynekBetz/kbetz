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
   DATABASE
========================= */
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("🔥 MongoDB Connected");
});

/* =========================
   DEBUG
========================= */
app.get("/test", (req, res) => {
  res.send("SERVER LIVE");
});

/* =========================
   🔥 SMART ODDS (AUTO SPORT)
========================= */
app.get("/api/odds", async (req, res) => {
  try {
    console.log("📡 Fetching active sports...");

    // 1️⃣ GET ALL SPORTS
    const sportsRes = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${process.env.ODDS_API_KEY}`
    );

    const sports = await sportsRes.json();

    // 2️⃣ FILTER ACTIVE SPORTS
    const activeSports = sports.filter((s) => s.active);

    console.log("✅ Active sports:", activeSports.length);

    let oddsData = [];

    // 3️⃣ LOOP UNTIL WE FIND DATA
    for (const sport of activeSports) {
      console.log("🔍 Trying:", sport.key);

      const oddsRes = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport.key}/odds/?regions=us,uk,eu&markets=h2h&apiKey=${process.env.ODDS_API_KEY}`
      );

      const data = await oddsRes.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log("🔥 FOUND DATA:", sport.key);
        oddsData = data;
        break;
      }
    }

    // ❌ NOTHING FOUND
    if (!oddsData.length) {
      return res.json([
        {
          team: "No Active Odds Found",
          home: "Try later",
          away: "API returned no games",
          bestHome: { odds: "-", book: "-" },
          bestAway: { odds: "-", book: "-" }
        }
      ]);
    }

    // 🔥 FORMAT
    const formatted = oddsData.map((game) => {
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
        home: "Check logs",
        away: "Check key",
        bestHome: { odds: "-", book: "-" },
        bestAway: { odds: "-", book: "-" }
      }
    ]);
  }
});

/* =========================
   AUTH
========================= */
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "User exists" });

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    email,
    password: hashed,
    pro: false
  });

  res.json({ message: "User created" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid login" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid login" });

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      pro: user.pro
    },
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

    res.json({
      email: user.email,
      pro: user.pro
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log("🔥 SERVER RUNNING ON PORT " + PORT);
});