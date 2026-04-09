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

/* DATABASE */
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("🔥 MongoDB Connected");
});

/* DEBUG */
app.get("/test", (req, res) => {
  res.send("SERVER LIVE");
});

/* 🔥 GUARANTEED ODDS ROUTE */
app.get("/api/odds", async (req, res) => {
  try {
    console.log("📡 Fetching guaranteed odds...");

    const url =
      `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/` +
      `?regions=eu` +
      `&markets=h2h` +
      `&bookmakers=bet365` +
      `&apiKey=${process.env.ODDS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("📊 EPL data:", data?.length);

    // ❌ IF STILL EMPTY → API LIMIT
    if (!Array.isArray(data) || data.length === 0) {
      return res.json([
        {
          team: "API LIMIT / NO DATA",
          home: "Upgrade plan",
          away: "or try later",
          bestHome: { odds: "-", book: "-" },
          bestAway: { odds: "-", book: "-" }
        }
      ]);
    }

    const formatted = data.map((game) => {
      let bestHome = { odds: "-", book: "" };
      let bestAway = { odds: "-", book: "" };

      game.bookmakers?.forEach((b) => {
        const market = b.markets?.find((m) => m.key === "h2h");
        if (!market) return;

        market.outcomes.forEach((o) => {
          if (o.name === game.home_team) {
            bestHome = { odds: o.price, book: b.title };
          }
          if (o.name === game.away_team) {
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

/* AUTH */
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

    res.json({ email: user.email, pro: user.pro });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

/* START */
app.listen(PORT, () => {
  console.log("🔥 SERVER RUNNING ON PORT " + PORT);
});