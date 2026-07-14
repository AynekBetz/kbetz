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

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 10000;
const CLIENT_URL = process.env.CLIENT_URL || "https://kbetz.vercel.app";
const ODDS_API_KEY = process.env.ODDS_API_KEY || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";

const SPORTS_TO_FETCH = [
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "americanfootball_nfl_preseason", label: "NFL Preseason" },
  { key: "americanfootball_ncaaf", label: "NCAAF" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "basketball_wnba", label: "WNBA" },
  { key: "basketball_nba_summer_league", label: "NBA Summer League" },
  { key: "mma_mixed_martial_arts", label: "MMA" },
  { key: "boxing_boxing", label: "Boxing" },
  { key: "soccer_usa_mls", label: "MLS" },
  { key: "soccer_epl", label: "EPL" },
];

/* ================= STRIPE ================= */
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

/* ================= MONGO ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err?.message || err));

/* ================= MODELS ================= */
const User = mongoose.model("User", {
  email: String,
  password: String,
  isPro: { type: Boolean, default: false },
  bankroll: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now },
});

const Bet = mongoose.model("Bet", {
  email: String,
  game: String,
  odds: Number,
  stake: Number,
  result: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

/* ================= HELPERS ================= */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function makeToken(email) {
  const clean = normalizeEmail(email);
  return `kbetz-session-${Buffer.from(clean).toString("base64")}-${Date.now()}`;
}

function computeEdge(homeOdds, awayOdds, index = 0) {
  const h = Math.abs(Number(homeOdds || -110));
  const a = Math.abs(Number(awayOdds || -110));
  const base = 4 + ((h + a + index * 7) % 15);
  return Number(base.toFixed(1));
}

function computeConfidence(edge, index = 0) {
  const val = 57 + Number(edge || 0) + (index % 8);
  return Math.min(92, Math.max(52, Math.round(val)));
}

function pickBestLine(game) {
  if (Number(game.homeOdds || 0) > Number(game.awayOdds || 0)) {
    return `${game.home} ML`;
  }

  return `${game.away} ML`;
}

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.json({
    ok: true,
    app: "KBETZ",
    message: "KBETZ API running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "KBETZ",
    server: "live",
    sports: SPORTS_TO_FETCH.map((s) => s.label),
  });
});


/* ================= PICK LOG MODEL ================= */
const pickLogSchema = new mongoose.Schema(
  {
    pickKey: { type: String, unique: true, index: true },
    gameId: String,
    sport: String,
    league: String,
    home: String,
    away: String,
    recommended: String,
    bestLine: String,
    homeOdds: Number,
    awayOdds: Number,
    edge: Number,
    confidence: Number,
    commenceTime: String,
    oddsSource: { type: String, default: "live" },
    modelVersion: { type: String, default: "kbetz-live-odds-v1" },
    result: { type: String, default: "pending" },
    status: { type: String, default: "pending" },
    finalScore: { type: String, default: "" },
    profit: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const PickLog =
  mongoose.models.PickLog || mongoose.model("PickLog", pickLogSchema);

/* ================= AUTH ================= */
app.post("/api/signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, password });
    }

    return res.json({
      success: true,
      token: makeToken(email),
      user: {
        email: user.email,
        isPro: user.isPro,
        bankroll: user.bankroll,
      },
    });
  } catch (err) {
    console.log("Signup error:", err?.message || err);

    return res.status(500).json({
      success: false,
      error: "Signup failed",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, password });
    }

    return res.json({
      success: true,
      token: makeToken(email),
      isPro: user.isPro,
      bankroll: user.bankroll,
      user: {
        email: user.email,
        isPro: user.isPro,
        bankroll: user.bankroll,
      },
    });
  } catch (err) {
    console.log("Login error:", err?.message || err);

    return res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

app.get("/api/me", async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    const user = email ? await User.findOne({ email }) : null;

    return res.json({
      success: true,
      email,
      isPro: user?.isPro || false,
      bankroll: user?.bankroll || 0,
      plan: user?.isPro ? "pro" : "free",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Could not load user",
    });
  }
});

/* ================= FALLBACK ODDS ================= */
let fakeTick = 0;

const FALLBACK_MATCHUPS = [
  { sport: "NBA", home: "Warriors", away: "Lakers" },
  { sport: "NBA", home: "Celtics", away: "Bucks" },
  { sport: "NBA", home: "Knicks", away: "Heat" },
  { sport: "NBA", home: "Suns", away: "Mavericks" },
  { sport: "NBA", home: "Nuggets", away: "Timberwolves" },
  { sport: "NBA", home: "Thunder", away: "Clippers" },

  { sport: "NFL", home: "Chiefs", away: "Raiders" },
  { sport: "NFL", home: "Cowboys", away: "Eagles" },
  { sport: "NFL", home: "49ers", away: "Seahawks" },
  { sport: "NFL", home: "Bills", away: "Dolphins" },
  { sport: "NFL", home: "Ravens", away: "Bengals" },
  { sport: "NFL", home: "Lions", away: "Packers" },

  { sport: "MLB", home: "Yankees", away: "Red Sox" },
  { sport: "MLB", home: "Dodgers", away: "Giants" },
  { sport: "MLB", home: "Braves", away: "Mets" },
  { sport: "MLB", home: "Astros", away: "Rangers" },
  { sport: "MLB", home: "Cubs", away: "Cardinals" },
  { sport: "MLB", home: "Phillies", away: "Marlins" },

  { sport: "NCAAF", home: "Alabama", away: "Georgia" },
  { sport: "NCAAF", home: "Ohio State", away: "Michigan" },
  { sport: "NCAAF", home: "Florida State", away: "Clemson" },
  { sport: "NCAAF", home: "Texas", away: "Oklahoma" },

  { sport: "NCAAB", home: "Duke", away: "North Carolina" },
  { sport: "NCAAB", home: "Kansas", away: "Kentucky" },
  { sport: "NCAAB", home: "UConn", away: "Villanova" },
  { sport: "NCAAB", home: "Gonzaga", away: "Arizona" },
];

function buildFallbackGames() {
  fakeTick++;

  return FALLBACK_MATCHUPS.map((m, idx) => {
    const drift = ((fakeTick + idx) % 9) - 4;
    const homeOdds = -110 + drift + (idx % 5);
    const awayOdds = -108 - drift - (idx % 4);
    const edge = computeEdge(homeOdds, awayOdds, idx);
    const confidence = computeConfidence(edge, idx);

    const game = {
      id: `fallback-${m.sport}-${idx + 1}`,
      sport: m.sport,
      league: m.sport,
      home: m.home,
      away: m.away,
      homeOdds,
      awayOdds,
      edge,
      confidence,
      source: "fallback",
      books: [
        { name: "DK", odds: homeOdds },
        { name: "FD", odds: awayOdds },
        { name: "MGM", odds: homeOdds + 2 },
        { name: "CZ", odds: awayOdds - 1 },
      ],
      markets: {
        h2h: true,
      },
    };

    game.bestLine = pickBestLine(game);
    game.recommended = game.bestLine;

    return game;
  });
}

/* ================= ODDS NORMALIZATION ================= */
function normalizeOddsGame(rawGame, sportLabel, index = 0) {
  let homeOdds = null;
  let awayOdds = null;
  const books = [];

  const homeTeam = rawGame.home_team || "Home";
  const awayTeam = rawGame.away_team || "Away";

  if (Array.isArray(rawGame.bookmakers)) {
    rawGame.bookmakers.forEach((book) => {
      const market = Array.isArray(book.markets)
        ? book.markets.find((m) => m.key === "h2h") || book.markets[0]
        : null;

      const outcomes = Array.isArray(market?.outcomes) ? market.outcomes : [];

      const homeOutcome = outcomes.find((o) => o.name === homeTeam);
      const awayOutcome = outcomes.find((o) => o.name === awayTeam);

      const bookHomeOdds = Number(homeOutcome?.price);
      const bookAwayOdds = Number(awayOutcome?.price);

      if (Number.isFinite(bookHomeOdds) && homeOdds === null) {
        homeOdds = bookHomeOdds;
      }

      if (Number.isFinite(bookAwayOdds) && awayOdds === null) {
        awayOdds = bookAwayOdds;
      }

      books.push({
        name: book.title || book.key || "Book",
        odds: Number.isFinite(bookHomeOdds)
          ? bookHomeOdds
          : Number.isFinite(bookAwayOdds)
            ? bookAwayOdds
            : 0,
        homeOdds: Number.isFinite(bookHomeOdds) ? bookHomeOdds : 0,
        awayOdds: Number.isFinite(bookAwayOdds) ? bookAwayOdds : 0,
      });
    });
  }

  if (!Number.isFinite(homeOdds)) homeOdds = -110 + (index % 7);
  if (!Number.isFinite(awayOdds)) awayOdds = -110 - (index % 5);

  const edge = computeEdge(homeOdds, awayOdds, index);
  const confidence = computeConfidence(edge, index);

  const game = {
    id: rawGame.id || `${sportLabel}-${homeTeam}-${awayTeam}`,
    sport: sportLabel,
    league: sportLabel,
    home: homeTeam,
    away: awayTeam,
    homeOdds,
    awayOdds,
    edge,
    confidence,
    commenceTime: rawGame.commence_time || null,
    source: "live",
    books: books.length ? books : [{ name: "Market", odds: homeOdds }],
    markets: {
      h2h: true,
    },
  };

  game.bestLine = pickBestLine(game);
  game.recommended = game.bestLine;

  return game;
}

async function fetchSportOdds(sport) {
  if (!ODDS_API_KEY) {
    throw new Error("Missing ODDS_API_KEY");
  }

  const url =
    `https://api.the-odds-api.com/v4/sports/${sport.key}/odds/` +
    `?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const msg =
      data?.message || data?.error || `Odds API error for ${sport.key}`;
    throw new Error(msg);
  }

  if (!Array.isArray(data)) {
    throw new Error(`Bad odds response for ${sport.key}`);
  }

  return data.map((game, index) => normalizeOddsGame(game, sport.label, index));
}

async function fetchOdds() {
  try {
    const results = await Promise.allSettled(
      SPORTS_TO_FETCH.map((sport) => fetchSportOdds(sport))
    );

    const liveGames = results.flatMap((result) => {
      if (result.status === "fulfilled") return result.value;

      console.log(
        "⚠️ Odds sport fetch failed:",
        result.reason?.message || result.reason
      );

      return [];
    });

    if (liveGames.length > 0) {
      console.log(`✅ Live odds loaded: ${liveGames.length} games`);
      return liveGames.slice(0, 80);
    }

    console.log("⚠️ No live games found. Using fallback board.");
    return buildFallbackGames();
  } catch (err) {
    console.log("⚠️ Odds fetch error. Using fallback:", err?.message || err);
    return buildFallbackGames();
  }
}

/* ================= ODDS ROUTES ================= */

/* ================= ODDS CACHE ================= */
const ODDS_CACHE_MS = Number(process.env.ODDS_CACHE_MS || 90000);
let oddsCache = null;

async function getCachedOdds() {
  const now = Date.now();

  if (
    oddsCache &&
    Array.isArray(oddsCache.games) &&
    oddsCache.games.length &&
    now - oddsCache.updatedAt < ODDS_CACHE_MS
  ) {
    return {
      ...oddsCache,
      cached: true,
      cacheAgeSeconds: Math.round((now - oddsCache.updatedAt) / 1000),
      cacheMs: ODDS_CACHE_MS,
    };
  }

  const games = await fetchOdds();
  const source = games.some((g) => g.source === "live") ? "live" : "fallback";

  oddsCache = {
    success: true,
    count: games.length,
    source,
    games,
    updatedAt: now,
  };

  return {
    ...oddsCache,
    cached: false,
    cacheAgeSeconds: 0,
    cacheMs: ODDS_CACHE_MS,
  };
}

app.get("/api/odds", async (req, res) => {
  try {
    const oddsPayload = await getCachedOdds();
    res.json(oddsPayload);
  } catch (err) {
    console.error("❌ /api/odds error:", err.message);
    res.status(500).json({
      success: false,
      source: "error",
      cached: false,
      count: 0,
      games: [],
      error: "Could not load odds",
    });
  }
});

app.get("/api/data", async (req, res) => {
  try {
    const oddsPayload = await getCachedOdds();
    res.json(oddsPayload);
  } catch (err) {
    console.error("❌ /api/data error:", err.message);
    res.status(500).json({
      success: false,
      source: "error",
      cached: false,
      count: 0,
      games: [],
      error: "Could not load data",
    });
  }
});



/* ================= SPORTSDATAIO TEST ROUTES ================= */
const SPORTSDATAIO_KEY = process.env.SPORTSDATAIO_KEY || "";

async function fetchSportsDataIO(url) {
  if (!SPORTSDATAIO_KEY) {
    throw new Error("SPORTSDATAIO_KEY is not configured");
  }

  const response = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": SPORTSDATAIO_KEY,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.Message ||
        data?.error ||
        `SportsDataIO request failed with status ${response.status}`
    );
  }

  return data;
}

app.get("/api/sportsdata/status", async (req, res) => {
  try {
    res.json({
      success: true,
      configured: Boolean(SPORTSDATAIO_KEY),
      message: SPORTSDATAIO_KEY
        ? "SportsDataIO key is configured"
        : "SportsDataIO key is missing",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


app.get("/api/sportsdata/nfl/scores", async (req, res) => {
  try {
    const season = req.query.season || "2026REG";
    const week = req.query.week || "1";

    const url =
      `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}`;

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      season,
      week,
      count: Array.isArray(data) ? data.length : 0,
      games: data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/scores error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/sportsdata/nfl/boxscores", async (req, res) => {
  try {
    const season = req.query.season || "2026REG";
    const week = req.query.week || "1";

    const url =
      `https://api.sportsdata.io/v3/nfl/stats/json/BoxScores/${season}/${week}`;

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      season,
      week,
      count: Array.isArray(data) ? data.length : 0,
      games: data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/boxscores error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


app.get("/api/sportsdata/nfl/players", async (req, res) => {
  try {
    const url = "https://api.sportsdata.io/v3/nfl/scores/json/Players";

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      count: Array.isArray(data) ? data.length : 0,
      players: data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/players error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/sportsdata/nfl/player-stats", async (req, res) => {
  try {
    const season = req.query.season || "2026REG";
    const week = req.query.week || "1";

    const url =
      `https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByWeek/${season}/${week}`;

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      season,
      week,
      count: Array.isArray(data) ? data.length : 0,
      players: data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/player-stats error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/sportsdata/nfl/injuries", async (req, res) => {
  try {
    const season = req.query.season || "2026REG";
    const week = req.query.week || "1";

    const url =
      `https://api.sportsdata.io/v3/nfl/scores/json/Injuries/${season}/${week}`;

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      season,
      week,
      count: Array.isArray(data) ? data.length : 0,
      injuries: data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/injuries error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/sportsdata/nfl/timeframes", async (req, res) => {
  try {
    const url =
      "https://api.sportsdata.io/v3/nfl/scores/json/Timeframes/current";

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/timeframes error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ================= PICK LOG / PUBLIC RECORD ================= */
function buildPickFromGame(game, oddsPayload) {
  const recommended =
    game.recommended || game.bestLine || `${game.home || "Home"} ML`;

  return {
    pickKey: `${game.id}:${recommended}:${game.commenceTime || ""}`,
    gameId: game.id,
    sport: game.sport || game.league || "SPORT",
    league: game.league || game.sport || "SPORT",
    home: game.home,
    away: game.away,
    recommended,
    bestLine: game.bestLine || recommended,
    homeOdds: Number(game.homeOdds || 0),
    awayOdds: Number(game.awayOdds || 0),
    edge: Number(game.edge || 0),
    confidence: Number(game.confidence || 0),
    commenceTime: game.commenceTime || "",
    oddsSource: oddsPayload?.source || game.source || "live",
    modelVersion: "kbetz-live-odds-v1",
    result: "pending",
    status: "pending",
    postedAt: new Date(),
  };
}

app.post("/api/picks/snapshot", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 25);
    const oddsPayload = await getCachedOdds();

    const games = (oddsPayload.games || [])
      .filter((game) => game && game.source === "live")
      .sort((a, b) => {
        const scoreA = Number(a.confidence || 0) + Number(a.edge || 0);
        const scoreB = Number(b.confidence || 0) + Number(b.edge || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    const pickKeys = [];

    for (const game of games) {
      const pick = buildPickFromGame(game, oddsPayload);
      pickKeys.push(pick.pickKey);

      await PickLog.updateOne(
        { pickKey: pick.pickKey },
        { $setOnInsert: pick },
        { upsert: true }
      );
    }

    const picks = await PickLog.find({ pickKey: { $in: pickKeys } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      source: oddsPayload.source,
      cached: oddsPayload.cached,
      cacheAgeSeconds: oddsPayload.cacheAgeSeconds,
      saved: picks.length,
      picks,
    });
  } catch (err) {
    console.error("❌ /api/picks/snapshot error:", err.message);
    res.status(500).json({
      success: false,
      error: "Could not save pick snapshot",
    });
  }
});

app.get("/api/picks/public", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 100);

    const picks = await PickLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: picks.length,
      picks,
    });
  } catch (err) {
    console.error("❌ /api/picks/public error:", err.message);
    res.status(500).json({
      success: false,
      error: "Could not load public picks",
    });
  }
});


function calculatePickProfit(pick, result) {
  const normalized = String(result || "").toLowerCase();

  if (normalized === "loss") return -1;
  if (normalized === "push") return 0;
  if (normalized !== "win") return 0;

  const recommended = String(pick.recommended || pick.bestLine || "");
  const away = String(pick.away || "");
  const home = String(pick.home || "");

  let odds = Number(pick.awayOdds || 0);

  if (recommended.includes(home)) {
    odds = Number(pick.homeOdds || 0);
  } else if (recommended.includes(away)) {
    odds = Number(pick.awayOdds || 0);
  }

  if (!odds) return 0;

  if (odds > 0) {
    return Number((odds / 100).toFixed(2));
  }

  return Number((100 / Math.abs(odds)).toFixed(2));
}

function requireGradeSecret(req, res) {
  const expected = process.env.PICK_GRADE_SECRET;

  if (!expected) {
    res.status(500).json({
      success: false,
      error: "PICK_GRADE_SECRET is not configured",
    });
    return false;
  }

  const provided =
    req.headers["x-kbetz-grade-secret"] ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    req.body?.secret;

  if (!provided || provided !== expected) {
    res.status(401).json({
      success: false,
      error: "Unauthorized grading request",
    });
    return false;
  }

  return true;
}

app.get("/api/picks/pending", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 100);

    const picks = await PickLog.find({ result: "pending" })
      .sort({ commenceTime: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: picks.length,
      picks,
    });
  } catch (err) {
    console.error("❌ /api/picks/pending error:", err.message);
    res.status(500).json({
      success: false,
      error: "Could not load pending picks",
    });
  }
});

app.post("/api/picks/grade", async (req, res) => {
  try {
    if (!requireGradeSecret(req, res)) return;

    const { pickKey, id, result, finalScore, notes } = req.body || {};
    const normalizedResult = String(result || "").toLowerCase();

    if (!["win", "loss", "push", "pending"].includes(normalizedResult)) {
      return res.status(400).json({
        success: false,
        error: "Result must be win, loss, push, or pending",
      });
    }

    if (!pickKey && !id) {
      return res.status(400).json({
        success: false,
        error: "pickKey or id is required",
      });
    }

    const query = pickKey ? { pickKey } : { _id: id };
    const pick = await PickLog.findOne(query);

    if (!pick) {
      return res.status(404).json({
        success: false,
        error: "Pick not found",
      });
    }

    const profit =
      normalizedResult === "pending"
        ? 0
        : calculatePickProfit(pick, normalizedResult);

    pick.result = normalizedResult;
    pick.status = normalizedResult;
    pick.finalScore = finalScore || pick.finalScore || "";
    pick.notes = notes || pick.notes || "";
    pick.profit = profit;

    await pick.save();

    res.json({
      success: true,
      message: "Pick graded",
      pick,
    });
  } catch (err) {
    console.error("❌ /api/picks/grade error:", err.message);
    res.status(500).json({
      success: false,
      error: "Could not grade pick",
    });
  }
});


/* ================= NFL AUTO GRADING ================= */
const NFL_TEAM_ABBR = {
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS"
};

function nflAbbr(nameOrAbbr) {
  const value = String(nameOrAbbr || "").trim();

  if (!value) return "";
  if (value.length <= 4) return value.toUpperCase();

  return NFL_TEAM_ABBR[value] || value.toUpperCase();
}

function gameMatchKey(away, home) {
  return [nflAbbr(away), nflAbbr(home)].sort().join("@");
}

function pickTeamAbbr(pick) {
  const recommended = String(pick.recommended || pick.bestLine || "");
  const home = String(pick.home || "");
  const away = String(pick.away || "");

  if (recommended.includes(home)) return nflAbbr(home);
  if (recommended.includes(away)) return nflAbbr(away);

  return "";
}

function scoreIsFinal(score) {
  if (!score) return false;

  const status = String(score.Status || "").toLowerCase();

  return Boolean(
    score.IsOver === true ||
      score.IsClosed === true ||
      score.Closed === true ||
      status === "final" ||
      status === "f" ||
      status === "closed" ||
      status === "completed"
  );
}

function scoreHasNumbers(score) {
  return (
    score &&
    score.AwayScore !== null &&
    score.AwayScore !== undefined &&
    score.HomeScore !== null &&
    score.HomeScore !== undefined &&
    !Number.isNaN(Number(score.AwayScore)) &&
    !Number.isNaN(Number(score.HomeScore))
  );
}

app.post("/api/picks/auto-grade-nfl", async (req, res) => {
  try {
    if (!requireGradeSecret(req, res)) return;

    const season = req.query.season || req.body?.season || "2026REG";
    const week = req.query.week || req.body?.week || "1";

    const url =
      `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}`;

    const games = await fetchSportsDataIO(url);
    const scoreList = Array.isArray(games) ? games : [];

    const scoresByMatch = new Map();

    for (const score of scoreList) {
      const key = gameMatchKey(score.AwayTeam, score.HomeTeam);
      if (key && key !== "@") scoresByMatch.set(key, score);
    }

    const pendingPicks = await PickLog.find({
      result: "pending",
      sport: "NFL",
    });

    const graded = [];
    const skipped = [];

    for (const pick of pendingPicks) {
      const key = gameMatchKey(pick.away, pick.home);
      const score = scoresByMatch.get(key);

      if (!score) {
        skipped.push({
          pickKey: pick.pickKey,
          reason: "No matching SportsDataIO game",
        });
        continue;
      }

      if (!scoreIsFinal(score)) {
        skipped.push({
          pickKey: pick.pickKey,
          reason: "Game is not final",
          status: score.Status || "unknown",
          isOver: score.IsOver,
          isClosed: score.IsClosed,
        });
        continue;
      }

      if (!scoreHasNumbers(score)) {
        skipped.push({
          pickKey: pick.pickKey,
          reason: "Final score missing",
        });
        continue;
      }

      const awayScore = Number(score.AwayScore);
      const homeScore = Number(score.HomeScore);
      const awayAbbr = nflAbbr(score.AwayTeam);
      const homeAbbr = nflAbbr(score.HomeTeam);
      const selectedTeam = pickTeamAbbr(pick);

      let result = "push";

      if (awayScore !== homeScore) {
        const winner = awayScore > homeScore ? awayAbbr : homeAbbr;
        result = selectedTeam === winner ? "win" : "loss";
      }

      const profit = calculatePickProfit(pick, result);

      pick.result = result;
      pick.status = result;
      pick.finalScore = `${score.AwayTeam} ${awayScore} - ${score.HomeTeam} ${homeScore}`;
      pick.notes = `Auto-graded from SportsDataIO NFL ${season} Week ${week}`;
      pick.profit = profit;

      await pick.save();

      graded.push({
        pickKey: pick.pickKey,
        recommended: pick.recommended,
        result,
        profit,
        finalScore: pick.finalScore,
      });
    }

    res.json({
      success: true,
      source: "sportsdataio",
      season,
      week,
      checked: pendingPicks.length,
      gradedCount: graded.length,
      skippedCount: skipped.length,
      graded,
      skipped,
    });
  } catch (err) {
    console.error("❌ /api/picks/auto-grade-nfl error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "Could not auto-grade NFL picks",
    });
  }
});


app.post("/api/picks/auto-grade-nfl-all", async (req, res) => {
  try {
    if (!requireGradeSecret(req, res)) return;

    const season = req.query.season || req.body?.season || "2026REG";

    const startWeek = Math.max(
      1,
      Number(req.query.startWeek || req.body?.startWeek || 1)
    );

    const endWeek = Math.min(
      22,
      Number(req.query.endWeek || req.body?.endWeek || 18)
    );

    if (startWeek > endWeek) {
      return res.status(400).json({
        success: false,
        error: "startWeek cannot be greater than endWeek",
      });
    }

    const scoresByMatch = new Map();
    const weeksChecked = [];

    for (let week = startWeek; week <= endWeek; week++) {
      const url =
        `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}`;

      try {
        const games = await fetchSportsDataIO(url);
        const scoreList = Array.isArray(games) ? games : [];

        weeksChecked.push({
          week,
          count: scoreList.length,
          success: true,
        });

        for (const score of scoreList) {
          const key = gameMatchKey(score.AwayTeam, score.HomeTeam);
          if (key && key !== "@") {
            scoresByMatch.set(key, {
              ...score,
              KBetzWeek: week,
            });
          }
        }
      } catch (weekErr) {
        weeksChecked.push({
          week,
          count: 0,
          success: false,
          error: weekErr.message,
        });
      }
    }

    const pendingPicks = await PickLog.find({
      result: "pending",
      sport: "NFL",
    });

    const graded = [];
    const skipped = [];

    for (const pick of pendingPicks) {
      const key = gameMatchKey(pick.away, pick.home);
      const score = scoresByMatch.get(key);

      if (!score) {
        skipped.push({
          pickKey: pick.pickKey,
          recommended: pick.recommended,
          game: `${pick.away} @ ${pick.home}`,
          reason: "No matching SportsDataIO game in checked weeks",
        });
        continue;
      }

      if (!scoreIsFinal(score)) {
        skipped.push({
          pickKey: pick.pickKey,
          recommended: pick.recommended,
          game: `${pick.away} @ ${pick.home}`,
          week: score.KBetzWeek,
          reason: "Game is not final",
          status: score.Status || "unknown",
          isOver: score.IsOver,
          isClosed: score.IsClosed,
        });
        continue;
      }

      if (!scoreHasNumbers(score)) {
        skipped.push({
          pickKey: pick.pickKey,
          recommended: pick.recommended,
          game: `${pick.away} @ ${pick.home}`,
          week: score.KBetzWeek,
          reason: "Final score missing",
        });
        continue;
      }

      const awayScore = Number(score.AwayScore);
      const homeScore = Number(score.HomeScore);
      const awayAbbr = nflAbbr(score.AwayTeam);
      const homeAbbr = nflAbbr(score.HomeTeam);
      const selectedTeam = pickTeamAbbr(pick);

      let result = "push";

      if (awayScore !== homeScore) {
        const winner = awayScore > homeScore ? awayAbbr : homeAbbr;
        result = selectedTeam === winner ? "win" : "loss";
      }

      const profit = calculatePickProfit(pick, result);

      pick.result = result;
      pick.status = result;
      pick.finalScore = `${score.AwayTeam} ${awayScore} - ${score.HomeTeam} ${homeScore}`;
      pick.notes = `Auto-graded from SportsDataIO NFL ${season} Week ${score.KBetzWeek}`;
      pick.profit = profit;

      await pick.save();

      graded.push({
        pickKey: pick.pickKey,
        recommended: pick.recommended,
        week: score.KBetzWeek,
        result,
        profit,
        finalScore: pick.finalScore,
      });
    }

    res.json({
      success: true,
      source: "sportsdataio",
      season,
      startWeek,
      endWeek,
      weeksChecked,
      checked: pendingPicks.length,
      matchedGames: scoresByMatch.size,
      gradedCount: graded.length,
      skippedCount: skipped.length,
      graded,
      skipped,
    });
  } catch (err) {
    console.error("❌ /api/picks/auto-grade-nfl-all error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "Could not auto-grade NFL picks across weeks",
    });
  }
});

app.get("/api/picks/record", async (req, res) => {
  try {
    const picks = await PickLog.find({}).lean();

    const wins = picks.filter((p) => p.result === "win").length;
    const losses = picks.filter((p) => p.result === "loss").length;
    const pushes = picks.filter((p) => p.result === "push").length;
    const pending = picks.filter((p) => p.result === "pending").length;

    const graded = wins + losses + pushes;
    const profit = picks.reduce((sum, p) => sum + Number(p.profit || 0), 0);
    const roi = graded ? Number(((profit / graded) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      total: picks.length,
      graded,
      pending,
      wins,
      losses,
      pushes,
      profit,
      roi,
      modelVersion: "kbetz-live-odds-v1",
    });
  } catch (err) {
    console.error("❌ /api/picks/record error:", err.message);
    res.status(500).json({
      success: false,
      error: "Could not load pick record",
    });
  }
});

/* ================= SOCKET ================= */
io.on("connection", (socket) => {
  console.log("⚡ Client connected");

  const send = async () => {
    const games = await fetchOdds();
    socket.emit("oddsUpdate", games);
  };

  send();

  const interval = setInterval(send, 10000);

  socket.on("disconnect", () => clearInterval(interval));
});

/* ================= BETS ================= */
app.post("/api/bet", async (req, res) => {
  try {
    const { email, game, odds, stake } = req.body;

    await Bet.create({
      email: normalizeEmail(email),
      game,
      odds: Number(odds || 0),
      stake: Number(stake || 0),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Could not save bet",
    });
  }
});

app.get("/api/bets", async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    const bets = await Bet.find({ email }).sort({ createdAt: -1 }).limit(100);
    res.json(bets);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* ================= ROI ================= */
app.get("/api/roi", async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    const bets = await Bet.find({ email });

    let profit = 0;
    let total = 0;
    let wins = 0;
    let losses = 0;

    bets.forEach((b) => {
      const stake = Number(b.stake || 0);
      const odds = Number(b.odds || 0);

      total += stake;

      if (b.result === "win") {
        wins++;

        if (odds > 0) profit += stake * (odds / 100);
        else profit += stake * (100 / Math.abs(odds));
      } else if (b.result === "loss") {
        losses++;
        profit -= stake;
      }
    });

    const completed = wins + losses;
    const roi = total ? ((profit / total) * 100).toFixed(2) : 0;
    const winRate = completed ? ((wins / completed) * 100).toFixed(1) : 0;

    res.json({
      roi,
      total,
      profit: Number(profit.toFixed(2)),
      wins,
      losses,
      winRate,
    });
  } catch (err) {
    res.json({
      roi: 0,
      total: 0,
      profit: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    });
  }
});

/* ================= STRIPE ================= */
app.post("/api/checkout", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        error: "Stripe is not configured",
      });
    }

    if (!STRIPE_PRICE_ID) {
      return res.status(500).json({
        success: false,
        error: "Stripe price ID is missing",
      });
    }

    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required for checkout",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${CLIENT_URL}/dashboard?email=${encodeURIComponent(
        email
      )}&success=true`,
      cancel_url: `${CLIENT_URL}/dashboard?canceled=true`,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    console.log("Stripe checkout error:", err?.message || err);

    res.status(500).json({
      success: false,
      error: err?.message || "Checkout failed",
    });
  }
});

/* ================= WEBHOOK / PRO HELPERS ================= */
app.post("/api/pro/activate", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email required",
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isPro: true },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      isPro: user.isPro,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Could not activate PRO",
    });
  }
});

/* ================= START ================= */
server.listen(PORT, () => {
  console.log(`🔥 KBETZ LIVE on ${PORT}`);
});