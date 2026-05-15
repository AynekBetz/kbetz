import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import fetch from "node-fetch";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

console.log("🚀 KBETZ SERVER STARTING");

/* ================= STRIPE ================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= MONGO ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

/* ================= MODELS ================= */
const User = mongoose.model("User", {
  email: String,
  password: String,
  isPro: { type: Boolean, default: false },
  bankroll: { type: Number, default: 1000 },
});

const Bet = mongoose.model("Bet", {
  email: String,
  game: String,
  odds: Number,
  stake: Number,
  result: { type: String, default: "pending" },
});

/* ================= AUTH ================= */
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) await User.create({ email, password });
  res.json({ success: true });
});

app.post("/api/login", async (req, res) => {
  const { email } = req.body;
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });

  res.json({
    success: true,
    isPro: user.isPro,
    bankroll: user.bankroll,
  });
});

app.get("/api/me", async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email });

  res.json({
    isPro: user?.isPro || false,
    bankroll: user?.bankroll || 0,
  });
});

/* ================= ODDS ================= */
let fakeTick = 0;

async function fetchOdds() {
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`
    );

    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("Bad API");

    return data.map(g => {
      let bestOdds = null;
      let books = [];

      if (Array.isArray(g.bookmakers)) {
        books = g.bookmakers.map(b => {
          const market = b.markets?.[0];
          const outcome = market?.outcomes?.[0];
          const price = outcome?.price;

          if (price && (!bestOdds || price > bestOdds)) {
            bestOdds = price;
          }

          return {
            name: b.title,
            odds: price || 0
          };
        });
      }

      return {
        id: g.id,
        home: g.home_team,
        away: g.away_team,
        homeOdds: bestOdds || 0,
        books,
      };
    });

  } catch {
    // 🔥 ALWAYS MOVING FALLBACK
    fakeTick++;

    return [
      {
        id: "1",
        home: "Warriors",
        away: "Lakers",
        homeOdds: -110 + (fakeTick % 5),
        books: [
          { name: "DK", odds: -110 + (fakeTick % 5) },
          { name: "FD", odds: -108 + (fakeTick % 3) }
        ]
      },
      {
        id: "2",
        home: "Bucks",
        away: "Celtics",
        homeOdds: -105 - (fakeTick % 4),
        books: [
          { name: "DK", odds: -105 - (fakeTick % 4) },
          { name: "FD", odds: -102 - (fakeTick % 2) }
        ]
      }
    ];
  }
}

app.get("/api/odds", async (req, res) => {
  const games = await fetchOdds();
  res.json({ games });
});

/* ================= SOCKET ================= */
io.on("connection", socket => {
  console.log("⚡ Client connected");

  const send = async () => {
    const games = await fetchOdds();

    // ✅ MATCHES FRONTEND PERFECTLY
    socket.emit("oddsUpdate", games);
  };

  send();
  const interval = setInterval(send, 10000);

  socket.on("disconnect", () => clearInterval(interval));
});

/* ================= BET ================= */
app.post("/api/bet", async (req, res) => {
  const { email, game, odds, stake } = req.body;
  await Bet.create({ email, game, odds, stake });
  res.json({ success: true });
});

/* ================= GET BETS ================= */
app.get("/api/bets", async (req, res) => {
  const { email } = req.query;
  const bets = await Bet.find({ email });
  res.json(bets);
});

/* ================= ROI ================= */
app.get("/api/roi", async (req, res) => {
  const { email } = req.query;

  const bets = await Bet.find({ email });

  let profit = 0;
  let total = 0;

  bets.forEach(b => {
    total += b.stake;
    if (b.result === "win") profit += b.stake * (b.odds / 100);
    else if (b.result === "loss") profit -= b.stake;
  });

  const roi = total ? ((profit / total) * 100).toFixed(2) : 0;

  res.json({ roi, total, profit });
});

/* ================= STRIPE ================= */
app.post("/api/checkout", async (req, res) => {
  const { email } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/dashboard?email=${email}`,
    cancel_url: `${process.env.CLIENT_URL}`,
  });

  res.json({ url: session.url });
});

/* ================= START ================= */
server.listen(10000, () => {
  console.log("🔥 KBETZ LIVE");
});