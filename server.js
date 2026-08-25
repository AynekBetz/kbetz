import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import fetch from "node-fetch";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const ALLOWED_ORIGINS = String(
  process.env.ALLOWED_ORIGINS ||
    process.env.CLIENT_URL ||
    "https://kbetz.vercel.app,http://localhost:3000"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowedOrigin =
        ALLOWED_ORIGINS.includes(origin) ||
        origin === "https://kbetz.vercel.app" ||
        origin.endsWith(".vercel.app") ||
        origin === "http://localhost:3000";

      if (isAllowedOrigin) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by KBETZ CORS policy")
      );
    },
    credentials: true,
  })
);
const jsonParser = express.json({ limit: "100kb" });

app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    return next();
  }

  return jsonParser(req, res, next);
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

console.log("🚀 KBETZ SERVER STARTING");

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 10000;
const CLIENT_URL = process.env.CLIENT_URL || "https://kbetz.vercel.app";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const PASSWORD_RESET_FROM_EMAIL =
  process.env.PASSWORD_RESET_FROM_EMAIL || "";
const ODDS_API_KEY = process.env.ODDS_API_KEY || "";
const THERUNDOWN_API_KEY = process.env.THERUNDOWN_API_KEY || "";
const APISPORTS_KEY = process.env.APISPORTS_KEY || "";
const APISPORTS_ENABLED =
  String(process.env.APISPORTS_ENABLED || "").toLowerCase() === "true";
const API_SPORTS_CACHE_MS = Number(
  process.env.API_SPORTS_CACHE_MS || 3600000
);

const API_SPORTS_EMPTY_CACHE_MS = Number(
  process.env.API_SPORTS_EMPTY_CACHE_MS || 300000
);

const API_SPORTS_LOOKAHEAD_DAYS = Math.min(
  7,
  Math.max(1, Number(process.env.API_SPORTS_LOOKAHEAD_DAYS || 3))
);

let apiSportsCache = null;
let apiSportsRefreshPromise = null;

/*
 * KBETZ PROVIDER PROTECTION
 *
 * Prevent repeated requests after a provider explicitly reports
 * quota exhaustion, suspension, or rate limiting.
 *
 * These cooldowns live in server memory and reset naturally when
 * Render restarts/redeploys.
 */
const ODDS_PROVIDER_COOLDOWN_MS = Number(
  process.env.ODDS_PROVIDER_COOLDOWN_MS || 21600000
); // 6 hours

const APISPORTS_PROVIDER_COOLDOWN_MS = Number(
  process.env.APISPORTS_PROVIDER_COOLDOWN_MS || 21600000
); // 6 hours

const THERUNDOWN_PROVIDER_COOLDOWN_MS = Number(
  process.env.THERUNDOWN_PROVIDER_COOLDOWN_MS || 900000
); // 15 minutes

let oddsProviderBlockedUntil = 0;
let apiSportsProviderBlockedUntil = 0;
let theRundownProviderBlockedUntil = 0;

function providerIsCoolingDown(blockedUntil) {
  return Number(blockedUntil || 0) > Date.now();
}

function providerCooldownMinutes(blockedUntil) {
  return Math.max(
    0,
    Math.ceil((Number(blockedUntil || 0) - Date.now()) / 60000)
  );
}

function isOddsQuotaError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("usage quota") ||
    message.includes("quota has been reached") ||
    message.includes("out of requests")
  );
}

function isApiSportsSuspendedError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("account is suspended") ||
    message.includes('"access"') && message.includes("suspended")
  );
}

function isTheRundownRateLimitError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("status 429") ||
    message.includes("with 429")
  );
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const OWNER_SECRET = process.env.OWNER_SECRET || "";
const OWNER_EMAIL = normalizeEmail(process.env.OWNER_EMAIL || "");
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 604800);

/*
 * KBETZ discovers currently active sports from The Odds API.
 * These values only control priority and the maximum number fetched.
 */
const ODDS_MAX_SPORTS = Math.max(
  1,
  Number(process.env.ODDS_MAX_SPORTS || 8)
);

const SPORT_PRIORITY = [
  "baseball_mlb",
  "americanfootball_nfl",
  "americanfootball_nfl_preseason",
  "americanfootball_ncaaf",
  "basketball_wnba",
  "basketball_nba",
  "basketball_ncaab",
  "icehockey_nhl",
  "soccer_usa_mls",
  "soccer_epl",
  "mma_mixed_martial_arts",
  "boxing_boxing",
];

const ALLOWED_SPORT_GROUPS = [
  "american football",
  "baseball",
  "basketball",
  "ice hockey",
  "soccer",
  "tennis",
  "golf",
  "mixed martial arts",
  "boxing",
  "motorsports",
  "rugby league",
  "rugby union",
  "cricket",
];

/* ================= STRIPE ================= */
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

/* ================= MONGO ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err?.message || err));

/* ================= MODELS ================= */
const User =
  mongoose.models.User ||
  mongoose.model("User", {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    isPro: { type: Boolean, default: false },
    bankroll: { type: Number, default: 1000 },
    trialUsed: { type: Boolean, default: false },

passwordResetTokenHash: {
  type: String,
  default: "",
  select: false,
},
passwordResetExpiresAt: {
  type: Date,
  default: null,
  select: false,
},
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function isStrongEnoughPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return `pbkdf2$210000$${salt}$${hash}`;
}

function hashResetToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token || ""))
    .digest("hex");
}

async function sendPasswordResetEmail(email, resetUrl) {
  if (!RESEND_API_KEY || !PASSWORD_RESET_FROM_EMAIL) {
    throw new Error("Password reset email service is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: PASSWORD_RESET_FROM_EMAIL,
      to: [email],
      subject: "Reset your KBETZ password",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Reset your KBETZ password</h2>
          <p>We received a request to reset your KBETZ password.</p>
          <p>
            <a href="${resetUrl}">
              Reset Password
            </a>
          </p>
          <p>This link expires in 30 minutes and can only be used once.</p>
          <p>If you did not request this reset, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data?.message ||
        data?.error ||
        `Password reset email failed with ${response.status}`
    );
  }
}

function verifyPassword(password, storedPassword) {
  const stored = String(storedPassword || "");

  // One-time compatibility path for accounts created before password hashing.
  if (!stored.startsWith("pbkdf2$")) {
    return stored.length > 0 && stored === password;
  }

  const [scheme, iterationsText, salt, expectedHex] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterationsText || !salt || !expectedHex) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 100000) return false;

  const actual = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function getSessionSecret() {
  if (SESSION_SECRET) return SESSION_SECRET;
  if (process.env.NODE_ENV !== "production") return "kbetz-local-development-secret-change-me";
  throw new Error("SESSION_SECRET is required in production");
}

function makeToken(email) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: normalizeEmail(email),
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(12).toString("hex"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  try {
    const [encoded, signature] = String(token || "").split(".");
    if (!encoded || !signature) return null;

    const expected = crypto
      .createHmac("sha256", getSessionSecret())
      .update(encoded)
      .digest("base64url");

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload?.sub || !payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function bearerToken(req) {
  const header = String(req.headers.authorization || "");
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function requireAuth(req, res, next) {
  const payload = verifyToken(bearerToken(req));

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  req.auth = payload;
  next();
}

function requireOwnerAccount(req, res, next) {
  if (!OWNER_EMAIL) {
    return res.status(503).json({
      success: false,
      error: "OWNER_EMAIL is not configured",
    });
  }

  const authenticatedEmail = normalizeEmail(req.auth?.sub);

  if (!authenticatedEmail || authenticatedEmail !== OWNER_EMAIL) {
    return res.status(403).json({
      success: false,
      error: "Owner access required",
    });
  }

  next();
}

function requireOwnerSecret(req, res, next) {
  if (!OWNER_SECRET) {
    return res.status(503).json({ success: false, error: "OWNER_SECRET is not configured" });
  }
  const provided = String(
    req.headers["x-kbetz-owner-secret"] ||
      req.headers.authorization?.replace("Bearer ", "") ||
      req.body?.secret ||
      ""
  );
  const a = Buffer.from(provided);
  const b = Buffer.from(OWNER_SECRET);
  if (!provided || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, error: "Owner authorization required" });
  }
  next();
}

const rateBuckets = new Map();
function rateLimit({ windowMs, max, name }) {
  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      return res.status(429).json({ success: false, error: "Too many requests. Please try again shortly." });
    }
    next();
  };
}

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, name: "auth" });

function americanOddsToProbability(odds) {
  const value = Number(odds);

  if (!Number.isFinite(value) || value === 0) return 0;

  if (value > 0) {
    return 100 / (value + 100);
  }

  return Math.abs(value) / (Math.abs(value) + 100);
}

function getFairMarketProbabilities(homeOdds, awayOdds) {
  const homeImplied = americanOddsToProbability(homeOdds);
  const awayImplied = americanOddsToProbability(awayOdds);
  const total = homeImplied + awayImplied;

  if (total <= 0) {
    return {
      homeImplied: 0,
      awayImplied: 0,
      homeFair: 0,
      awayFair: 0,
      vig: 0,
    };
  }

  return {
    homeImplied,
    awayImplied,
    homeFair: homeImplied / total,
    awayFair: awayImplied / total,
    vig: Math.max(0, total - 1),
  };
}

function computeEdge(homeOdds, awayOdds, index = 0) {
  const market = getFairMarketProbabilities(homeOdds, awayOdds);

  // A two-sided sportsbook market alone does not prove an independent
  // predictive betting edge. Keep this neutral until KBETZ has a
  // separately validated probability model.
  return 0;
}

function computeConfidence(edge, index = 0, homeOdds = null, awayOdds = null) {
  if (Number.isFinite(Number(homeOdds)) && Number.isFinite(Number(awayOdds))) {
    const market = getFairMarketProbabilities(homeOdds, awayOdds);
    return Math.round(Math.max(market.homeFair, market.awayFair) * 100);
  }

  return 0;
}

function pickBestLine(game) {
  const market = getFairMarketProbabilities(
    game?.homeOdds,
    game?.awayOdds
  );

  if (market.homeFair >= market.awayFair) {
    return `${game.home} ML`;
  }

  return `${game.away} ML`;
}


/*
 * VERIFIED MARKET ANALYSIS
 *
 * This is market intelligence, not an independent predictive model.
 * It uses only genuine sportsbook prices already attached to the game.
 *
 * It intentionally does NOT manufacture EV, predictive edge, injuries,
 * pitcher ratings, recent form, or an artificial win probability.
 */
function analyzeVerifiedMarket(game) {
  const books = Array.isArray(game?.books)
    ? game.books.filter(
        (book) =>
          Number.isFinite(Number(book?.homeOdds)) &&
          Number.isFinite(Number(book?.awayOdds)) &&
          Number(book.homeOdds) !== 0 &&
          Number(book.awayOdds) !== 0
      )
    : [];

  if (!books.length) {
    return null;
  }

  const bookMarkets = books.map((book) => {
    const market = getFairMarketProbabilities(
      Number(book.homeOdds),
      Number(book.awayOdds)
    );

    return {
      name: book.name || "Book",
      homeOdds: Number(book.homeOdds),
      awayOdds: Number(book.awayOdds),
      homeFair: market.homeFair,
      awayFair: market.awayFair,
      vig: market.vig,
      homeDelta: Number.isFinite(Number(book.homeDelta))
        ? Number(book.homeDelta)
        : 0,
      awayDelta: Number.isFinite(Number(book.awayDelta))
        ? Number(book.awayDelta)
        : 0,
    };
  });

  const homeConsensus =
    bookMarkets.reduce((sum, book) => sum + book.homeFair, 0) /
    bookMarkets.length;

  const awayConsensus =
    bookMarkets.reduce((sum, book) => sum + book.awayFair, 0) /
    bookMarkets.length;

  const bestHomeBook = bookMarkets.reduce((best, book) =>
    book.homeOdds > best.homeOdds ? book : best
  );

  const bestAwayBook = bookMarkets.reduce((best, book) =>
    book.awayOdds > best.awayOdds ? book : best
  );

  const recommendedSide =
    homeConsensus >= awayConsensus ? "home" : "away";

  const recommendedTeam =
    recommendedSide === "home" ? game.home : game.away;

  const consensusProbability =
    recommendedSide === "home"
      ? homeConsensus
      : awayConsensus;

  const bestBook =
    recommendedSide === "home"
      ? bestHomeBook
      : bestAwayBook;

  const movementValues = bookMarkets
    .map((book) =>
      recommendedSide === "home"
        ? Number(book.homeDelta)
        : Number(book.awayDelta)
    )
    .filter((value) => Number.isFinite(value) && value !== 0);

  /*
   * Measure sportsbook movement agreement by majority direction.
   *
   * Do not anchor agreement to whichever sportsbook happens to
   * appear first. Only direction matters here; the raw magnitude
   * of a provider price_delta does not increase the score.
   */
  const positiveMovements =
    movementValues.filter((value) => value > 0).length;

  const negativeMovements =
    movementValues.filter((value) => value < 0).length;

  const movementAgreement =
    movementValues.length > 0
      ? Math.max(positiveMovements, negativeMovements) /
        movementValues.length
      : 0;

  /*
   * Market quality ranks the reliability/depth of the observed market.
   * It is NOT a predicted win probability and NOT expected value.
   *
   * 70% consensus strength
   * 20% sportsbook coverage (up to 3 currently requested books)
   * 10% directional movement agreement when movement exists
   */
  const coverageScore = Math.min(bookMarkets.length / 3, 1);

  const marketQualityScore = Number(
    (
      consensusProbability * 70 +
      coverageScore * 20 +
      movementAgreement * 10
    ).toFixed(2)
  );

  return {
    recommended: `${recommendedTeam} ML`,
    recommendedSide,

    marketConfidence: Math.round(consensusProbability * 100),
    marketConsensusProbability: Number(
      (consensusProbability * 100).toFixed(2)
    ),

    marketQualityScore,

    bestOdds: Number(
      recommendedSide === "home"
        ? bestBook.homeOdds
        : bestBook.awayOdds
    ),
    bestBook: bestBook.name,

    bestHomeOdds: bestHomeBook.homeOdds,
    bestHomeBook: bestHomeBook.name,
    bestAwayOdds: bestAwayBook.awayOdds,
    bestAwayBook: bestAwayBook.name,

    booksUsed: bookMarkets.length,
    movementAgreement: Number(
      (movementAgreement * 100).toFixed(2)
    ),

    // Until KBETZ has a separately validated predictive probability,
    // these remain neutral rather than fabricated.
    edge: 0,
    expectedValue: null,
  };
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
  const mongoConnected = mongoose.connection.readyState === 1;

  const cachedGames =
    Array.isArray(oddsCache?.games)
      ? oddsCache.games
      : [];

  const activeSports = [
    ...new Set(
      cachedGames
        .map((game) => String(game?.sport || game?.league || "").trim())
        .filter(Boolean)
    ),
  ];

  res.json({
    ok: true,
    success: true,
    app: "KBETZ",
    server: "live",

    mongo: mongoConnected,
    database: mongoConnected ? "connected" : "disconnected",

    stripeConfigured: Boolean(STRIPE_SECRET_KEY && STRIPE_PRICE_ID),
    apiSportsConfigured: Boolean(
      APISPORTS_ENABLED && APISPORTS_KEY
    ),
    oddsApiConfigured: Boolean(ODDS_API_KEY),

    provider: oddsCache?.source || "waiting",
    gamesLoaded: cachedGames.length,
    sports: activeSports,

    updatedAt: oddsCache?.updatedAt || null,
    timestamp: Date.now(),
  });
});

app.get("/api/supported-sports", async (req, res) => {
  try {
    if (!ODDS_API_KEY) {
      return res.json({
        success: true,
        configured: false,
        sports: SPORTS_TO_FETCH,
      });
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}`
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});


/* ================= PICK LOG MODEL ================= */
const pickLogSchema = new mongoose.Schema(
  {
    pickKey: { type: String, unique: true, index: true },
    releaseDate: { type: String, default: "" },
    releaseSet: { type: String, default: "" },
    releaseLabel: { type: String, default: "" },
    releaseNumber: { type: Number, default: 0 },
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
app.post("/api/signup", authRateLimit, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: "A valid email is required" });
    }
    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must be between 8 and 128 characters",
      });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: "An account with this email already exists" });
    }

    const user = await User.create({ email, password: hashPassword(password) });
    return res.status(201).json({
      success: true,
      token: makeToken(email),
      user: { email: user.email, isPro: user.isPro, bankroll: user.bankroll },
    });
  } catch (err) {
    console.log("Signup error:", err?.message || err);
    if (err?.code === 11000) {
      return res.status(409).json({ success: false, error: "An account with this email already exists" });
    }
    return res.status(500).json({ success: false, error: "Signup failed" });
  }
});

app.post("/api/login", authRateLimit, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    // Transparently migrate old plaintext passwords after a valid login.
    if (!String(user.password || "").startsWith("pbkdf2$")) {
      user.password = hashPassword(password);
      await user.save();
    }

    return res.json({
      success: true,
      token: makeToken(email),
      isPro: user.isPro,
      bankroll: user.bankroll,
      user: { email: user.email, isPro: user.isPro, bankroll: user.bankroll },
    });
  } catch (err) {
    console.log("Login error:", err?.message || err);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

app.post("/api/forgot-password", authRateLimit, async (req, res) => {
  const genericMessage =
    "If an account exists for that email, a password reset link has been sent.";

  try {
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
      return res.json({
        success: true,
        message: genericMessage,
      });
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetTokenHash +passwordResetExpiresAt"
    );

    if (!user) {
      return res.json({
        success: true,
        message: genericMessage,
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpiresAt =
      new Date(Date.now() + 30 * 60 * 1000);

    await user.save();

    const resetUrl =
      `${CLIENT_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (mailError) {
      user.passwordResetTokenHash = "";
      user.passwordResetExpiresAt = null;
      await user.save();

      console.error(
        "Password reset email error:",
        mailError?.message || mailError
      );

      return res.status(503).json({
        success: false,
        error: "Password reset email service is temporarily unavailable.",
      });
    }

    return res.json({
      success: true,
      message: genericMessage,
    });
  } catch (err) {
    console.error(
      "Forgot password error:",
      err?.message || err
    );

    return res.status(500).json({
      success: false,
      error: "Could not process password reset request.",
    });
  }
});

app.post("/api/reset-password", authRateLimit, async (req, res) => {
  try {
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Reset token is required.",
      });
    }

    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must be between 8 and 128 characters.",
      });
    }

    const tokenHash = hashResetToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select(
      "+passwordResetTokenHash +passwordResetExpiresAt"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "This password reset link is invalid or has expired.",
      });
    }

    user.password = hashPassword(password);
    user.passwordResetTokenHash = "";
    user.passwordResetExpiresAt = null;

    await user.save();

    return res.json({
      success: true,
      message: "Your KBETZ password has been reset successfully.",
    });
  } catch (err) {
    console.error(
      "Reset password error:",
      err?.message || err
    );

    return res.status(500).json({
      success: false,
      error: "Could not reset password.",
    });
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const email = normalizeEmail(req.auth.sub);
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.json({
      success: true,
      email,
      isPro: Boolean(user.isPro),
      bankroll: Number(user.bankroll || 0),
      plan: user.isPro ? "pro" : "free",
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Could not load user",
    });
  }
});

/* ================= OWNER DASHBOARD ================= */
app.get(
  "/api/owner/dashboard",
  requireAuth,
  requireOwnerAccount,
  async (req, res) => {
    try {
      const [totalUsers, proMembers] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isPro: true }),
      ]);

      const freeMembers = Math.max(0, totalUsers - proMembers);

      const conversionRate =
        totalUsers > 0
          ? Number(((proMembers / totalUsers) * 100).toFixed(1))
          : 0;

      let revenueToday = 0;
      let monthlyRevenue = 0;
      let lifetimeRevenue = 0;
      let mrr = 0;
      let activeSubscriptions = 0;
      let trialSubscriptions = 0;

      if (stripe) {
        const now = new Date();

        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        /*
         * Successful Stripe charges.
         * Refunds are subtracted so Mission Control shows
         * actual net collected revenue.
         */
        for await (const charge of stripe.charges.list({
          limit: 100,
        })) {
          if (
            charge?.paid !== true ||
            charge?.status !== "succeeded"
          ) {
            continue;
          }

          const createdMs = Number(charge.created || 0) * 1000;

          const amountCaptured = Number(
            charge.amount_captured ?? charge.amount ?? 0
          );

          const amountRefunded = Number(
            charge.amount_refunded || 0
          );

          const netAmount = Math.max(
            0,
            amountCaptured - amountRefunded
          );

          lifetimeRevenue += netAmount;

          if (createdMs >= startOfMonth.getTime()) {
            monthlyRevenue += netAmount;
          }

          if (createdMs >= startOfToday.getTime()) {
            revenueToday += netAmount;
          }
        }

        /*
         * Active + trialing subscriptions.
         * Convert recurring prices into monthly-equivalent revenue.
         */
        for await (const subscription of stripe.subscriptions.list({
          status: "all",
          limit: 100,
        })) {
          if (
            subscription.status !== "active" &&
            subscription.status !== "trialing"
          ) {
            continue;
          }

          if (subscription.status === "active") {
            activeSubscriptions += 1;
          }

          if (subscription.status === "trialing") {
            trialSubscriptions += 1;
          }

          const items = Array.isArray(subscription?.items?.data)
            ? subscription.items.data
            : [];

          for (const item of items) {
            const price = item?.price;

            const unitAmount = Number(
              price?.unit_amount || 0
            );

            const quantity = Math.max(
              1,
              Number(item?.quantity || 1)
            );

            const recurring = price?.recurring;

            if (!unitAmount || !recurring) {
              continue;
            }

            const interval = String(
              recurring.interval || ""
            ).toLowerCase();

            const intervalCount = Math.max(
              1,
              Number(recurring.interval_count || 1)
            );

            let monthlyAmount = 0;

            if (interval === "month") {
              monthlyAmount =
                (unitAmount * quantity) / intervalCount;
            } else if (interval === "year") {
              monthlyAmount =
                (unitAmount * quantity) /
                (12 * intervalCount);
            } else if (interval === "week") {
              monthlyAmount =
                (unitAmount * quantity * 52) /
                (12 * intervalCount);
            } else if (interval === "day") {
              monthlyAmount =
                (unitAmount * quantity * 365) /
                (12 * intervalCount);
            }

            /*
             * Trialing subscriptions are counted as trials,
             * but are not counted toward collected MRR yet.
             */
            if (subscription.status === "active") {
              mrr += monthlyAmount;
            }
          }
        }
      }

      const centsToDollars = (value) =>
        Number((Number(value || 0) / 100).toFixed(2));

      return res.json({
        success: true,
        owner: normalizeEmail(req.auth.sub),
        metrics: {
          totalUsers,
          proMembers,
          freeMembers,
          conversionRate,

          revenueToday: centsToDollars(revenueToday),
          monthlyRevenue: centsToDollars(monthlyRevenue),
          lifetimeRevenue: centsToDollars(lifetimeRevenue),

          mrr: centsToDollars(mrr),

          activeSubscriptions,
          trialSubscriptions,

          // Real-time connected KBETZ dashboard clients.
          // Socket.IO keeps this collection synchronized as
          // clients connect and disconnect.
          liveNow: io?.sockets?.sockets?.size ?? 0,
        },
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error(
        "❌ /api/owner/dashboard error:",
        err?.message || err
      );

      return res.status(500).json({
        success: false,
        error: "Could not load owner dashboard metrics",
      });
    }
  }
);



/* ================= OWNER USER AUDIT ================= */
app.get(
  "/api/owner/users-audit",
  requireAuth,
  requireOwnerAccount,
  async (req, res) => {
    try {
      const users = await User.find({})
        .select("email isPro bankroll trialUsed createdAt")
        .sort({ createdAt: 1 })
        .lean();

      return res.json({
        success: true,
        count: users.length,
        users: users.map((user) => ({
          email: normalizeEmail(user.email),
          isPro: Boolean(user.isPro),
          plan: user.isPro ? "pro" : "free",
          trialUsed: Boolean(user.trialUsed),
          bankroll: Number(user.bankroll || 0),
          createdAt: user.createdAt || null,
        })),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error(
        "❌ /api/owner/users-audit error:",
        err?.message || err
      );

      return res.status(500).json({
        success: false,
        error: "Could not load owner user audit",
      });
    }
  }
);

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
    const confidence = computeConfidence(edge, idx, homeOdds, awayOdds);

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
  const confidence = computeConfidence(edge, index, homeOdds, awayOdds);

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

  /*
   * Apply verified multi-book market analysis to live Odds API games.
   * This supplies the market fields required by Official Picks.
   */
  const verifiedMarket = analyzeVerifiedMarket(game);

  if (verifiedMarket) {
    game.recommended = verifiedMarket.recommended;
    game.bestLine = verifiedMarket.recommended;

    game.confidence = verifiedMarket.marketConfidence;
    game.marketConfidence = verifiedMarket.marketConfidence;
    game.marketConsensusProbability =
      verifiedMarket.marketConsensusProbability;

    game.marketQualityScore =
      verifiedMarket.marketQualityScore;

    game.bestOdds = verifiedMarket.bestOdds;
    game.bestBook = verifiedMarket.bestBook;

    game.bestHomeOdds = verifiedMarket.bestHomeOdds;
    game.bestHomeBook = verifiedMarket.bestHomeBook;
    game.bestAwayOdds = verifiedMarket.bestAwayOdds;
    game.bestAwayBook = verifiedMarket.bestAwayBook;

    game.booksUsed = verifiedMarket.booksUsed;
    game.movementAgreement =
      verifiedMarket.movementAgreement;

    game.edge = 0;
    game.expectedValue = null;
  } else {
    game.bestLine = pickBestLine(game);
    game.recommended = game.bestLine;
  }

  return game;
}

async function fetchActiveSports() {
  if (!ODDS_API_KEY) {
    throw new Error("Missing ODDS_API_KEY");
  }

  const url =
    `https://api.the-odds-api.com/v4/sports/` +
    `?apiKey=${ODDS_API_KEY}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Active sports request failed with status ${response.status}`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error("Invalid active sports response");
  }

  const activeSports = data
    .filter((sport) => {
      const group = String(sport?.group || "").toLowerCase();

      return (
        sport?.active === true &&
        sport?.has_outrights !== true &&
        ALLOWED_SPORT_GROUPS.some((allowed) => group.includes(allowed))
      );
    })
    .map((sport) => ({
      key: sport.key,
      label: sport.title || sport.description || sport.key,
      group: sport.group || "Other",
    }));

  activeSports.sort((a, b) => {
    const aPriority = SPORT_PRIORITY.indexOf(a.key);
    const bPriority = SPORT_PRIORITY.indexOf(b.key);

    const aRank = aPriority === -1 ? 999 : aPriority;
    const bRank = bPriority === -1 ? 999 : bPriority;

    if (aRank !== bRank) return aRank - bRank;
    return String(a.label).localeCompare(String(b.label));
  });

  return activeSports.slice(0, ODDS_MAX_SPORTS);
}

app.get("/api/debug/active-sports", async (req, res) => {
  try {
    const sports = await fetchActiveSports();

    return res.json({
      success: true,
      count: sports.length,
      maxSports: ODDS_MAX_SPORTS,
      sports,
    });
  } catch (err) {
    console.error(
      "❌ Active sports inspector error:",
      err?.message || err
    );

    return res.status(500).json({
      success: false,
      error: err?.message || "Could not load active sports",
    });
  }
});

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


function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function apiSportsHeaders() {
  return {
    Accept: "application/json",
    "x-apisports-key": APISPORTS_KEY,
  };
}

async function fetchApiSportsJson(url) {
  const response = await fetch(url, {
    headers: apiSportsHeaders(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.errors?.token ||
        data?.errors?.requests ||
        `API-Sports request failed with status ${response.status}`
    );
  }

  if (data?.errors && Object.keys(data.errors).length > 0) {
    throw new Error(JSON.stringify(data.errors));
  }

  return Array.isArray(data?.response) ? data.response : [];
}

function normalizeApiSportsGame({
  raw,
  sport,
  league,
  home,
  away,
  startTime,
  id,
}) {
  return {
    id: String(id || `${sport}-${away}-${home}-${startTime || Date.now()}`),
    sport,
    league: league || sport,
    home: home || "Home",
    away: away || "Away",

    /*
     * API-Sports schedule feeds do not automatically guarantee sportsbook
     * prices. Keep odds null so KBETZ never invents -110 lines.
     */
    homeOdds: null,
    awayOdds: null,
    edge: 0,
    confidence: 0,
    commenceTime: startTime || null,
    source: "api-sports",
    provider: "API-Sports",
    hasOdds: false,
    books: [],
    markets: {
      h2h: false,
    },
    bestLine: null,
    recommended: null,
  };
}

async function fetchApiSportsBaseball(date) {
  const rows = await fetchApiSportsJson(
    `https://v1.baseball.api-sports.io/games?date=${date}`
  );

  return rows.map((row) =>
    normalizeApiSportsGame({
      raw: row,
      id: row?.id,
      sport: "BASEBALL",
      league: row?.league?.name || "Baseball",
      home: row?.teams?.home?.name,
      away: row?.teams?.away?.name,
      startTime: row?.date,
    })
  );
}

async function fetchApiSportsBasketball(date) {
  const rows = await fetchApiSportsJson(
    `https://v1.basketball.api-sports.io/games?date=${date}`
  );

  return rows.map((row) =>
    normalizeApiSportsGame({
      raw: row,
      id: row?.id,
      sport: "BASKETBALL",
      league: row?.league?.name || "Basketball",
      home: row?.teams?.home?.name,
      away: row?.teams?.away?.name,
      startTime: row?.date,
    })
  );
}

async function fetchApiSportsHockey(date) {
  const rows = await fetchApiSportsJson(
    `https://v1.hockey.api-sports.io/games?date=${date}`
  );

  return rows.map((row) =>
    normalizeApiSportsGame({
      raw: row,
      id: row?.id,
      sport: "HOCKEY",
      league: row?.league?.name || "Hockey",
      home: row?.teams?.home?.name,
      away: row?.teams?.away?.name,
      startTime: row?.date,
    })
  );
}

async function fetchApiSportsSoccer(date) {
  const rows = await fetchApiSportsJson(
    `https://v3.football.api-sports.io/fixtures?date=${date}`
  );

  return rows.map((row) =>
    normalizeApiSportsGame({
      raw: row,
      id: row?.fixture?.id,
      sport: "SOCCER",
      league: row?.league?.name || "Soccer",
      home: row?.teams?.home?.name,
      away: row?.teams?.away?.name,
      startTime: row?.fixture?.date,
    })
  );
}

async function fetchApiSportsGamesFresh() {
  if (!APISPORTS_ENABLED) {
    console.log("ℹ️ API-Sports fallback is disabled.");
    return [];
  }

  if (!APISPORTS_KEY) {
    console.log("⚠️ APISPORTS_KEY is missing.");
    return [];
  }

  if (providerIsCoolingDown(apiSportsProviderBlockedUntil)) {
    console.log(
      `🛡️ API-Sports cooling down for approximately ` +
        `${providerCooldownMinutes(apiSportsProviderBlockedUntil)} more minute(s).`
    );
    return [];
  }

  const allGames = [];
  const labels = ["Baseball", "Basketball", "Soccer", "Hockey"];

  for (let dayOffset = 0; dayOffset < API_SPORTS_LOOKAHEAD_DAYS; dayOffset += 1) {
    const dateObject = new Date();

    dateObject.setUTCDate(dateObject.getUTCDate() + dayOffset);

    const date = dateObject.toISOString().slice(0, 10);

    console.log(
      `🛟 Checking API-Sports schedules for ${date} ` +
        `(day ${dayOffset + 1}/${API_SPORTS_LOOKAHEAD_DAYS})`
    );

    const results = await Promise.allSettled([
      fetchApiSportsBaseball(date),
      fetchApiSportsBasketball(date),
      fetchApiSportsSoccer(date),
      fetchApiSportsHockey(date),
    ]);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allGames.push(...result.value);
        return;
      }

      console.log(
        `⚠️ API-Sports ${labels[index]} error for ${date}:`,
        result.reason?.message || result.reason
      );

      if (isApiSportsSuspendedError(result.reason)) {
        apiSportsProviderBlockedUntil =
          Date.now() + APISPORTS_PROVIDER_COOLDOWN_MS;
      }
    });

    if (providerIsCoolingDown(apiSportsProviderBlockedUntil)) {
      console.log(
        `🛡️ API-Sports suspended response detected. ` +
          `Pausing provider for approximately ` +
          `${providerCooldownMinutes(apiSportsProviderBlockedUntil)} minute(s).`
      );
      break;
    }

    const uniqueCount = new Set(
      allGames.map(
        (game) =>
          game.id ||
          `${game.sport}-${game.away}-${game.home}-${game.commenceTime}`
      )
    ).size;

    console.log(
      `📅 API-Sports schedule total after ${date}: ${uniqueCount}`
    );

    // Stop early once the dashboard limit has been satisfied.
    if (uniqueCount >= 80) {
      break;
    }
  }

  const uniqueGames = Array.from(
    new Map(
      allGames.map((game) => [
        game.id ||
          `${game.sport}-${game.away}-${game.home}-${game.commenceTime}`,
        game,
      ])
    ).values()
  );

  uniqueGames.sort((a, b) => {
    const aTime = new Date(a.commenceTime || 0).getTime();
    const bTime = new Date(b.commenceTime || 0).getTime();

    return aTime - bTime;
  });

  console.log(
    `✅ API-Sports returned ${uniqueGames.length} real upcoming games`
  );

  return uniqueGames.slice(0, 80);
}


async function fetchApiSportsGames() {
  const now = Date.now();

  const apiSportsCacheTtl =
    Array.isArray(apiSportsCache?.games) &&
    apiSportsCache.games.length > 0
      ? API_SPORTS_CACHE_MS
      : API_SPORTS_EMPTY_CACHE_MS;

  if (
    apiSportsCache &&
    Array.isArray(apiSportsCache.games) &&
    now - apiSportsCache.updatedAt < apiSportsCacheTtl
  ) {
    console.log(
      `♻️ Using cached API-Sports schedule data (${Math.round(
        (now - apiSportsCache.updatedAt) / 60000
      )} minutes old)`
    );

    return apiSportsCache.games;
  }

  if (apiSportsRefreshPromise) {
    console.log("⏳ Waiting for the current API-Sports refresh.");
    return apiSportsRefreshPromise;
  }

  apiSportsRefreshPromise = (async () => {
    const games = await fetchApiSportsGamesFresh();

    apiSportsCache = {
      games: Array.isArray(games) ? games : [],
      updatedAt: Date.now(),
    };

    return apiSportsCache.games;
  })();

  try {
    return await apiSportsRefreshPromise;
  } finally {
    apiSportsRefreshPromise = null;
  }
}

const THERUNDOWN_BOOKS = {
  "19": "DraftKings",
  "22": "BetMGM",
  "23": "FanDuel",
};

function normalizeTheRundownEvent(event, sportLabel = "MLB", index = 0) {
  const teams = Array.isArray(event?.teams) ? event.teams : [];

  const awayTeam = teams.find((team) => team?.is_away);
  const homeTeam = teams.find((team) => team?.is_home);

  if (!awayTeam || !homeTeam) {
    return null;
  }

  const moneylineMarket = Array.isArray(event?.markets)
    ? event.markets.find(
        (market) =>
          Number(market?.market_id) === 1 ||
          String(market?.name || "").toLowerCase() === "moneyline"
      )
    : null;

  const participants = Array.isArray(moneylineMarket?.participants)
    ? moneylineMarket.participants
    : [];

  const awayParticipant = participants.find(
    (participant) =>
      Number(participant?.id) === Number(awayTeam.team_id)
  );

  const homeParticipant = participants.find(
    (participant) =>
      Number(participant?.id) === Number(homeTeam.team_id)
  );

  const awayPrices =
    awayParticipant?.lines?.[0]?.prices &&
    typeof awayParticipant.lines[0].prices === "object"
      ? awayParticipant.lines[0].prices
      : {};

  const homePrices =
    homeParticipant?.lines?.[0]?.prices &&
    typeof homeParticipant.lines[0].prices === "object"
      ? homeParticipant.lines[0].prices
      : {};

  const books = [];

  for (const [affiliateId, bookName] of Object.entries(THERUNDOWN_BOOKS)) {
    const awayOdds = Number(awayPrices?.[affiliateId]?.price);
    const homeOdds = Number(homePrices?.[affiliateId]?.price);

    if (!Number.isFinite(awayOdds) || !Number.isFinite(homeOdds)) {
      continue;
    }

    books.push({
      name: bookName,
      awayOdds,
      homeOdds,
      odds: homeOdds,

      awayDelta: Number.isFinite(
        Number(awayPrices?.[affiliateId]?.price_delta)
      )
        ? Number(awayPrices[affiliateId].price_delta)
        : 0,

      homeDelta: Number.isFinite(
        Number(homePrices?.[affiliateId]?.price_delta)
      )
        ? Number(homePrices[affiliateId].price_delta)
        : 0,

      updatedAt:
        homePrices?.[affiliateId]?.updated_at ||
        awayPrices?.[affiliateId]?.updated_at ||
        null,
    });
  }

  if (!books.length) {
    return null;
  }

  const baseBook = books[0];

  const homeOdds = Number(baseBook.homeOdds);
  const awayOdds = Number(baseBook.awayOdds);

  const edge = computeEdge(homeOdds, awayOdds, index);
  const confidence = computeConfidence(edge, index, homeOdds, awayOdds);

  const homeName =
    `${homeTeam.name || ""} ${homeTeam.mascot || ""}`.trim();

  const awayName =
    `${awayTeam.name || ""} ${awayTeam.mascot || ""}`.trim();

  const game = {
    id:
      event.event_id ||
      event.event_uuid ||
      `therundown-${sportLabel}-${index}`,

    sport: sportLabel,
    league: event?.schedule?.league_name || sportLabel,

    home: homeName || homeTeam.abbreviation || "Home",
    away: awayName || awayTeam.abbreviation || "Away",

    homeOdds,
    awayOdds,

    edge,
    confidence,

    commenceTime: event.event_date || null,

    source: "therundown",
    provider: "TheRundown",
    hasOdds: true,

    books,

    markets: {
      h2h: true,
    },

    status: event?.score?.event_status || null,
    venue: event?.score?.venue_name || null,

    pitcherHome: event?.pitcher_home?.name || null,
    pitcherAway: event?.pitcher_away?.name || null,
  };

  // Apply verified multi-book market analysis to TheRundown MLB.
  // This remains market intelligence, not an independent prediction model.
  const verifiedMarket = analyzeVerifiedMarket(game);

  if (verifiedMarket) {
    game.recommended = verifiedMarket.recommended;
    game.bestLine = verifiedMarket.recommended;

    game.confidence = verifiedMarket.marketConfidence;
    game.marketConfidence = verifiedMarket.marketConfidence;
    game.marketConsensusProbability =
      verifiedMarket.marketConsensusProbability;

    game.marketQualityScore =
      verifiedMarket.marketQualityScore;

    game.bestOdds = verifiedMarket.bestOdds;
    game.bestBook = verifiedMarket.bestBook;

    game.bestHomeOdds = verifiedMarket.bestHomeOdds;
    game.bestHomeBook = verifiedMarket.bestHomeBook;
    game.bestAwayOdds = verifiedMarket.bestAwayOdds;
    game.bestAwayBook = verifiedMarket.bestAwayBook;

    game.booksUsed = verifiedMarket.booksUsed;
    game.movementAgreement =
      verifiedMarket.movementAgreement;

    game.edge = 0;
    game.expectedValue = null;
  } else {
    // Preserve existing behavior if multi-book analysis is unavailable.
    game.bestLine = pickBestLine(game);
    game.recommended = game.bestLine;
  }

  return game;
}


/*
 * TEMPORARY OWNER-PROTECTED THERUNDOWN SCORE INSPECTOR
 *
 * Used only to identify TheRundown's real score fields so the
 * MLB grader can be wired correctly. No API key is returned.
 */
app.get(
  "/api/debug/therundown-score",
  requireOwnerSecret,
  async (req, res) => {
    try {
      if (!THERUNDOWN_API_KEY) {
        return res.status(503).json({
          success: false,
          error: "TheRundown is not configured",
        });
      }

      const requestedDate =
        String(req.query.date || "").trim() ||
        new Date().toISOString().slice(0, 10);

      const url =
        `https://therundown.io/api/v2/sports/3/events/${requestedDate}` +
        `?market_ids=1&affiliate_ids=19,22,23&main_line=true&offset=300`;

      const response = await fetch(url, {
        headers: {
          "X-TheRundown-Key": THERUNDOWN_API_KEY,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");

        return res.status(response.status).json({
          success: false,
          error: `TheRundown request failed: ${body.slice(0, 300)}`,
        });
      }

      const data = await response.json();

      const events = Array.isArray(data?.events)
        ? data.events
        : [];

      return res.json({
        success: true,
        date: requestedDate,
        count: events.length,

        events: events.slice(0, 20).map((event) => ({
          eventId:
            event?.event_id ||
            event?.event_uuid ||
            null,

          eventDate: event?.event_date || null,

          teams: Array.isArray(event?.teams)
            ? event.teams.map((team) => ({
                teamId: team?.team_id,
                name: team?.name,
                mascot: team?.mascot,
                abbreviation: team?.abbreviation,
                isHome: Boolean(team?.is_home),
                isAway: Boolean(team?.is_away),
              }))
            : [],

          score: event?.score || null,
        })),
      });
    } catch (err) {
      console.error(
        "❌ TheRundown score inspector error:",
        err?.message || err
      );

      return res.status(500).json({
        success: false,
        error: "Could not inspect TheRundown scores",
      });
    }
  }
);

app.get("/api/debug/therundown-football", async (req, res) => {
  try {
    if (!THERUNDOWN_API_KEY) {
      return res.status(503).json({
        success: false,
        configured: false,
        error: "THERUNDOWN_API_KEY is not configured",
      });
    }

    const date = new Date().toISOString().slice(0, 10);

    const sports = [
      { id: 1, label: "NCAA Football" },
      { id: 2, label: "NFL" },
    ];

    const results = [];

    for (const sport of sports) {
      const url =
        `https://therundown.io/api/v2/sports/${sport.id}/events/${date}` +
        `?market_ids=1&affiliate_ids=19,22,23&main_line=true&offset=300`;

      const response = await fetch(url, {
        headers: {
          "X-TheRundown-Key": THERUNDOWN_API_KEY,
          Accept: "application/json",
        },
      });

      const raw = await response.text();

      let data = null;

      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }

      const events = Array.isArray(data?.events)
        ? data.events
        : [];

      const normalized = events
        .map((event, index) =>
          normalizeTheRundownEvent(event, sport.label, index)
        )
        .filter(Boolean);

      results.push({
        sportId: sport.id,
        sport: sport.label,
        providerStatus: response.status,
        success: response.ok,
        rawEvents: events.length,
        usableGames: normalized.length,
        error:
          response.ok
            ? null
            : data?.message ||
              data?.error ||
              raw.slice(0, 200),
      });
    }

    return res.json({
      success: true,
      provider: "TheRundown",
      date,
      results,
    });
  } catch (err) {
    console.error(
      "❌ TheRundown football diagnostic error:",
      err?.message || err
    );

    return res.status(500).json({
      success: false,
      error:
        err?.message ||
        "Could not inspect TheRundown football",
    });
  }
});

async function fetchTheRundownMLB() {
  if (!THERUNDOWN_API_KEY) {
    console.log("ℹ️ TheRundown is not configured.");
    return [];
  }

  if (providerIsCoolingDown(theRundownProviderBlockedUntil)) {
    console.log(
      `🛡️ TheRundown cooling down for approximately ` +
        `${providerCooldownMinutes(theRundownProviderBlockedUntil)} more minute(s).`
    );
    return [];
  }

  const date = new Date().toISOString().slice(0, 10);

  const url =
    `https://therundown.io/api/v2/sports/3/events/${date}` +
    `?market_ids=1&affiliate_ids=19,22,23&main_line=true&offset=300`;

  const response = await fetch(url, {
    headers: {
      "X-TheRundown-Key": THERUNDOWN_API_KEY,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    if (response.status === 429) {
      theRundownProviderBlockedUntil =
        Date.now() + THERUNDOWN_PROVIDER_COOLDOWN_MS;

      console.log(
        `🛡️ TheRundown rate limit detected. Pausing provider for approximately ` +
          `${providerCooldownMinutes(theRundownProviderBlockedUntil)} minute(s).`
      );
    }

    throw new Error(
      `TheRundown MLB request failed with ${response.status}: ${body.slice(0, 300)}`
    );
  }

  const data = await response.json();

  const events = Array.isArray(data?.events)
    ? data.events
    : [];

  const games = events
    .map((event, index) =>
      normalizeTheRundownEvent(event, "MLB", index)
    )
    .filter(Boolean);

  console.log(
    `✅ TheRundown MLB loaded: ${games.length} real sportsbook games`
  );

  return games;
}

async function fetchOdds() {
  try {
    if (providerIsCoolingDown(oddsProviderBlockedUntil)) {
      console.log(
        `🛡️ The Odds API quota cooldown is active for approximately ` +
          `${providerCooldownMinutes(oddsProviderBlockedUntil)} more minute(s).`
      );

      try {
        const rundownGames = await fetchTheRundownMLB();

        if (rundownGames.length > 0) {
          return rundownGames;
        }
      } catch (rundownError) {
        console.log(
          "⚠️ TheRundown fallback error:",
          rundownError?.message || rundownError
        );
      }

      return await fetchApiSportsGames();
    }

    const activeSports = await fetchActiveSports();

    console.log(
      `🌎 Active sports selected: ${
        activeSports.map((sport) => sport.label).join(", ") || "none"
      }`
    );

    const results = await Promise.allSettled(
      activeSports.map((sport) => fetchSportOdds(sport))
    );

    const liveGames = results.flatMap((result) => {
      if (result.status === "fulfilled") return result.value;

      console.log(
        "⚠️ Odds sport fetch failed:",
        result.reason?.message || result.reason
      );

      if (isOddsQuotaError(result.reason)) {
        oddsProviderBlockedUntil =
          Date.now() + ODDS_PROVIDER_COOLDOWN_MS;
      }

      return [];
    });

    if (liveGames.length > 0) {
      const uniqueGames = Array.from(
        new Map(
          liveGames.map((game) => [
            game.id || `${game.sport}-${game.away}-${game.home}`,
            game,
          ])
        ).values()
      );

      console.log(
        `✅ Real sportsbook markets loaded: ${uniqueGames.length} games`
      );

      return uniqueGames.slice(0, 80);
    }

    /*
     * The special "upcoming" key returns real live events and the next
     * upcoming events across multiple sports. It does not create demo games.
     */
    if (providerIsCoolingDown(oddsProviderBlockedUntil)) {
      throw new Error(
        "Usage quota has been reached. Provider cooldown activated."
      );
    }

    console.log(
      "ℹ️ No markets from selected sports. Checking real upcoming markets."
    );

    const upcomingGames = await fetchSportOdds({
      key: "upcoming",
      label: "Upcoming",
    });

    if (upcomingGames.length > 0) {
      console.log(
        `✅ Upcoming cross-sport markets loaded: ${upcomingGames.length}`
      );

      return upcomingGames.slice(0, 20);
    }

      console.log(
        "ℹ️ The Odds API returned no usable markets. Trying TheRundown."
      );

      try {
        const rundownGames = await fetchTheRundownMLB();

        if (rundownGames.length > 0) {
          return rundownGames;
        }
      } catch (rundownError) {
        console.log(
          "⚠️ TheRundown fallback error:",
          rundownError?.message || rundownError
        );
      }

      console.log(
        "ℹ️ TheRundown returned no usable markets. Trying API-Sports."
      );

      return await fetchApiSportsGames();
  } catch (err) {
      if (isOddsQuotaError(err)) {
        oddsProviderBlockedUntil =
          Date.now() + ODDS_PROVIDER_COOLDOWN_MS;

        console.log(
          `🛡️ The Odds API quota exhaustion detected. ` +
            `Pausing provider for approximately ` +
            `${providerCooldownMinutes(oddsProviderBlockedUntil)} minute(s).`
        );
      }

      console.log("⚠️ The Odds API error:", err?.message || err);
      console.log("🛟 Switching to TheRundown fallback.");

      try {
        const rundownGames = await fetchTheRundownMLB();

        if (rundownGames.length > 0) {
          return rundownGames;
        }
      } catch (rundownError) {
        console.log(
          "⚠️ TheRundown fallback error:",
          rundownError?.message || rundownError
        );
      }

      console.log("🛟 Switching to API-Sports fallback.");
    try {
      return await fetchApiSportsGames();
    } catch (fallbackError) {
      console.log(
        "⚠️ API-Sports fallback error:",
        fallbackError?.message || fallbackError
      );
      return [];
    }
  }
}


app.get("/api/apisports/status", (req, res) => {
  res.json({
    success: true,
    enabled: APISPORTS_ENABLED,
    configured: Boolean(APISPORTS_KEY),
    provider: "API-Sports",
  });
});

app.get("/api/apisports/games", async (req, res) => {
  try {
    const games = await fetchApiSportsGames();

    res.json({
      success: true,
      source: games.length ? "api-sports" : "empty",
      count: games.length,
      games,
      updatedAt: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      source: "error",
      count: 0,
      games: [],
      error: error?.message || "API-Sports request failed",
    });
  }
});

/* ================= ODDS ROUTES ================= */

/* ================= ODDS CACHE ================= */
const ODDS_CACHE_MS = Number(process.env.ODDS_CACHE_MS || 300000);
let oddsCache = null;
let oddsRefreshPromise = null;
async function getCachedOdds() {
  const now = Date.now();

  if (
    oddsCache &&
    Array.isArray(oddsCache.games) &&
    now - oddsCache.updatedAt < ODDS_CACHE_MS
  ) {
    return {
      ...oddsCache,
      cached: true,
      cacheAgeSeconds: Math.round((now - oddsCache.updatedAt) / 1000),
      cacheMs: ODDS_CACHE_MS,
    };
  }

  // If another request is already refreshing the cache,
  // wait for it instead of starting another refresh.
  if (oddsRefreshPromise) {
    await oddsRefreshPromise;

    return {
      ...oddsCache,
      cached: true,
      cacheAgeSeconds: Math.round((Date.now() - oddsCache.updatedAt) / 1000),
      cacheMs: ODDS_CACHE_MS,
    };
  }

  oddsRefreshPromise = (async () => {
    const games = await fetchOdds();
      const source = games.some((g) => g.source === "live")
        ? "live"
        : games.some((g) => g.source === "therundown")
          ? "therundown"
          : games.some((g) => g.source === "api-sports")
            ? "api-sports"
            : "empty";

    oddsCache = {
      success: true,
      count: games.length,
      source,
      games,
      updatedAt: Date.now(),
    };
  })();

  try {
    await oddsRefreshPromise;
  } finally {
    oddsRefreshPromise = null;
  }

  return {
    ...oddsCache,
    cached: false,
    cacheAgeSeconds: 0,
    cacheMs: ODDS_CACHE_MS,
  };
}

/* ================= THERUNDOWN TEST ================= */
app.get("/api/therundown/status", async (req, res) => {
  try {
    if (!THERUNDOWN_API_KEY) {
      return res.status(503).json({
        success: false,
        configured: false,
        error: "THERUNDOWN_API_KEY is not configured",
      });
    }

    const response = await fetch(
      "https://therundown.io/api/v2/sports",
      {
        headers: {
          "X-TheRundown-Key": THERUNDOWN_API_KEY,
          Accept: "application/json",
        },
      }
    );

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw: raw.slice(0, 1000) };
    }

    return res.status(response.status).json({
      success: response.ok,
      configured: true,
      provider: "TheRundown",
      providerStatus: response.status,
      data,
    });
  } catch (err) {
    console.error("TheRundown status error:", err?.message || err);

    return res.status(500).json({
      success: false,
      configured: true,
      provider: "TheRundown",
      error: err?.message || "TheRundown request failed",
    });
  }
});

/* ================= THERUNDOWN MLB ODDS TEST ================= */
app.get("/api/therundown/mlb-test", async (req, res) => {
  try {
    if (!THERUNDOWN_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "THERUNDOWN_API_KEY is not configured",
      });
    }

    const date = new Date().toISOString().slice(0, 10);

    const url =
      `https://therundown.io/api/v2/sports/3/events/${date}` +
      `?market_ids=1&affiliate_ids=19,22,23&main_line=true&offset=300`;

    const response = await fetch(url, {
      headers: {
        "X-TheRundown-Key": THERUNDOWN_API_KEY,
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    return res.status(response.status).json({
      success: response.ok,
      provider: "TheRundown",
      sport: "MLB",
      date,
      providerStatus: response.status,
      eventCount: Array.isArray(data?.events)
        ? data.events.length
        : 0,
      data,
    });
  } catch (err) {
    console.error(
      "TheRundown MLB test error:",
      err?.message || err
    );

    return res.status(500).json({
      success: false,
      provider: "TheRundown",
      error: err?.message || "TheRundown MLB request failed",
    });
  }
});

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


app.get("/api/sportsdata/nfl/teams", async (req, res) => {
  try {
    const url = "https://api.sportsdata.io/v3/nfl/scores/json/Teams";

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      count: Array.isArray(data) ? data.length : 0,
      teams: data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/teams error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/sportsdata/nfl/roster", async (req, res) => {
  try {
    const team = String(req.query.team || "CAR").toUpperCase();

    const url =
      `https://api.sportsdata.io/v3/nfl/scores/json/Players/${team}`;

    const data = await fetchSportsDataIO(url);

    res.json({
      success: true,
      source: "sportsdataio",
      team,
      count: Array.isArray(data) ? data.length : 0,
      players: data,
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/roster error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/sportsdata/nfl/player-search", async (req, res) => {
  try {
    const q = String(req.query.q || "").toLowerCase().trim();
    const team = req.query.team
      ? String(req.query.team).toUpperCase()
      : "";

    const url = team
      ? `https://api.sportsdata.io/v3/nfl/scores/json/Players/${team}`
      : "https://api.sportsdata.io/v3/nfl/scores/json/Players";

    const data = await fetchSportsDataIO(url);
    const players = Array.isArray(data) ? data : [];

    const filtered = q
      ? players.filter((p) => {
          const name = String(
            p.Name || p.FullName || `${p.FirstName || ""} ${p.LastName || ""}`
          ).toLowerCase();

          const position = String(p.Position || "").toLowerCase();
          const playerTeam = String(p.Team || "").toLowerCase();

          return (
            name.includes(q) ||
            position.includes(q) ||
            playerTeam.includes(q)
          );
        })
      : players;

    res.json({
      success: true,
      source: "sportsdataio",
      team: team || "ALL",
      query: q,
      count: filtered.length,
      players: filtered.slice(0, 100),
    });
  } catch (err) {
    console.error("❌ /api/sportsdata/nfl/player-search error:", err.message);
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
function getOfficialPickRelease(releaseSet) {
  const releases = {
    morning: {
      releaseSet: "morning",
      releaseLabel: "Morning Picks",
      releaseNumber: 1,
      releaseHour: 9,
      releaseTime: "9:00 AM ET",
    },
    afternoon: {
      releaseSet: "afternoon",
      releaseLabel: "Afternoon Picks",
      releaseNumber: 2,
      releaseHour: 14,
      releaseTime: "2:00 PM ET",
    },
    evening: {
      releaseSet: "evening",
      releaseLabel: "Evening Picks",
      releaseNumber: 3,
      releaseHour: 19,
      releaseTime: "7:00 PM ET",
    },
  };

  return releases[String(releaseSet || "").toLowerCase()] || null;
}

function getEasternClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const hour = Number(
    parts.find((part) => part.type === "hour")?.value || 0
  );

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value || 0
  );

  return {
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  };
}

function isOfficialReleaseAvailable(release, date = new Date()) {
  if (!release) return false;

  const clock = getEasternClock(date);
  const releaseMinutes = Number(release.releaseHour) * 60;

  return clock.totalMinutes >= releaseMinutes;
}

function getEasternReleaseDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildPickFromGame(game, oddsPayload, release) {
  const recommended =
    game.recommended || game.bestLine || `${game.home || "Home"} ML`;

  const releaseDate = getEasternReleaseDate();

  return {
    pickKey:
      `${releaseDate}:${release.releaseSet}:` +
      `${game.id}:${recommended}:${game.commenceTime || ""}`,

    releaseDate,
    releaseSet: release.releaseSet,
    releaseLabel: release.releaseLabel,
    releaseNumber: release.releaseNumber,

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
    oddsSource: game.source || oddsPayload?.source || "unknown",
    modelVersion: "kbetz-live-odds-v1",
    result: "pending",
    status: "pending",
    postedAt: new Date(),
  };
}

/*
 * ============================================================
 * KBETZ V3 OFFICIAL PICKS PUBLISHER
 * ============================================================
 *
 * One internal publisher is shared by:
 *
 * 1. Automatic scheduled releases
 * 2. Protected owner/manual publishing
 *
 * Existing PickLog release locking remains authoritative.
 * A release already published today will NOT be duplicated.
 */
async function publishOfficialPickRelease(
  releaseSet,
  requestedLimit = 3
) {
  try {
    const release = getOfficialPickRelease(releaseSet);

    if (!release) {
      return {
        success: false,
        error:
          "Official release required: morning, afternoon, or evening",
      };
    }

    const releaseDate = getEasternReleaseDate();

    // Official customer releases cannot be published before
    // their scheduled Eastern Time release.
    if (!isOfficialReleaseAvailable(release)) {
      return {
        success: false,
        releaseDate,
        releaseSet: release.releaseSet,
        releaseLabel: release.releaseLabel,
        releaseNumber: release.releaseNumber,
        releaseTime: release.releaseTime,
        locked: false,
        alreadyPublished: false,
        error:
          `${release.releaseLabel} unlock at ${release.releaseTime}.`,
      };
    }

    // A published Official Picks set is immutable.
    // If this release already exists for today, return the locked
    // records instead of creating or adding any new picks.
    const existingReleasePicks = await PickLog.find({
      releaseDate,
      releaseSet: release.releaseSet,
    })
      .sort({ createdAt: 1 })
      .lean();

    if (existingReleasePicks.length > 0) {
      return {
        success: true,
        releaseDate,
        releaseSet: release.releaseSet,
        releaseLabel: release.releaseLabel,
        releaseNumber: release.releaseNumber,
        releaseTime: release.releaseTime,
        locked: true,
        alreadyPublished: true,
        saved: existingReleasePicks.length,
        picks: existingReleasePicks,
      };
    }

    const limit = Math.min(
      Math.max(Number(requestedLimit || 3), 1),
      3
    );

    const oddsPayload = await getCachedOdds();

    /*
     * KBETZ V3 OFFICIAL PICK QUALITY GATE
     *
     * Official Picks are NOT automatically the three biggest
     * sportsbook favorites.
     *
     * A game must first meet verified market-quality standards.
     * KBETZ may publish fewer than three picks when the available
     * slate does not provide enough qualified opportunities.
     *
     * This score ranks market evidence. It is NOT represented as
     * an independent predicted win probability.
     */
    /*
     * OFFICIAL PICKS GAME-TIME WINDOW
     *
     * Only consider games that:
     * 1. Have a real scheduled start time
     * 2. Have not already started
     * 3. Begin within the next 48 hours
     *
     * This prevents a current Official Picks release from selecting
     * a high-quality market scheduled weeks into the future.
     */
    const officialPickNow = Date.now();
    const officialPickMaxTime =
      officialPickNow + 48 * 60 * 60 * 1000;

    const qualifiedGames = (oddsPayload.games || [])
      .filter(
        (game) => {
          if (!game) return false;

          const commenceMs = Date.parse(game.commenceTime || "");

          const gameTimeQualified =
            Number.isFinite(commenceMs) &&
            commenceMs > officialPickNow &&
            commenceMs <= officialPickMaxTime;

          return (
            gameTimeQualified &&
            ["live", "therundown"].includes(
              String(game.source || "").toLowerCase()
            ) &&
            Number.isFinite(Number(game.homeOdds)) &&
            Number.isFinite(Number(game.awayOdds)) &&
            Array.isArray(game.books) &&
            game.books.length >= 2 &&
            Number.isFinite(Number(game.marketQualityScore)) &&
            Number.isFinite(Number(game.marketConsensusProbability)) &&
            Number.isFinite(Number(game.movementAgreement))
          );
        }
      )
      .map((game) => {
        const consensus =
          Number(game.marketConsensusProbability || 0);

        const quality =
          Number(game.marketQualityScore || 0);

        const movement =
          Number(game.movementAgreement || 0);

        const books =
          Number(game.booksUsed || game.books.length || 0);

        /*
         * Qualification rules:
         *
         * - At least two genuine sportsbook prices
         * - Consensus must show a meaningful lean
         * - Market quality must clear the minimum standard
         * - Conflicting line movement is penalized
         *
         * Movement is supporting evidence, not a requirement,
         * because zero movement can simply mean a stable market.
         */
        /*
         * KBETZ V3 VERIFIED QUALITY THRESHOLDS
         *
         * Zero movement is NEUTRAL — it is not confirmation.
         * Positive movement must show meaningful agreement.
         *
         * We intentionally prefer publishing fewer qualified
         * Official Picks instead of forcing weak selections.
         */
        const consensusQualified = consensus >= 58;
        const qualityQualified = quality >= 60;

        const movementAvailable = movement > 0;
        const movementQualified =
          !movementAvailable || movement >= 60;

        const qualified =
          books >= 2 &&
          consensusQualified &&
          qualityQualified &&
          movementQualified;

        /*
         * Ranking score combines independent market observations.
         * This is a selection score only — NOT customer-facing
         * win probability and NOT fabricated predictive edge.
         */
        const selectionScore =
          quality * 0.50 +
          consensus * 0.30 +
          Math.min(books / 3, 1) * 10 +
          (movement > 0 ? movement * 0.10 : 0);

        return {
          ...game,
          kbetzQualified: qualified,
          kbetzSelectionScore:
            Number(selectionScore.toFixed(2)),
        };
      })
      .filter((game) => game.kbetzQualified === true);

    const games = qualifiedGames
      .sort(
        (a, b) =>
          Number(b.kbetzSelectionScore || 0) -
          Number(a.kbetzSelectionScore || 0)
      )
      .slice(0, limit);

    const pickKeys = [];

    for (const game of games) {
      const pick = buildPickFromGame(
        game,
        oddsPayload,
        release
      );

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

    return {
      success: true,
      releaseDate,
      releaseSet: release.releaseSet,
      releaseLabel: release.releaseLabel,
      releaseNumber: release.releaseNumber,
      releaseTime: release.releaseTime,
      locked: true,
      alreadyPublished: false,
      source: oddsPayload.source,
      cached: oddsPayload.cached,
      cacheAgeSeconds: oddsPayload.cacheAgeSeconds,
      saved: picks.length,
      picks,
    };

  } catch (err) {
    console.error(
      `❌ Official Picks ${releaseSet} publish error:`,
      err.message
    );

    return {
      success: false,
      error: "Could not save pick snapshot",
    };
  }
}


/*
 * PROTECTED MANUAL OFFICIAL PICKS ENDPOINT
 *
 * This remains available for owner emergency/manual use,
 * but public visitors cannot trigger an Official Picks release.
 */
app.post(
  "/api/picks/snapshot",
  requireOwnerSecret,
  async (req, res) => {
    const result = await publishOfficialPickRelease(
      req.query.release,
      req.query.limit
    );

    if (!result.success) {
      const status =
        String(result.error || "").includes("unlock at")
          ? 409
          : String(result.error || "").includes(
              "Official release required"
            )
          ? 400
          : 500;

      return res.status(status).json(result);
    }

    return res.json(result);
  }
);


/*
 * ============================================================
 * KBETZ V3 AUTOMATIC OFFICIAL RELEASE SCHEDULER
 * ============================================================
 *
 * Official release times:
 *
 * Morning   9:00 AM ET
 * Afternoon 2:00 PM ET
 * Evening   7:00 PM ET
 *
 * The scheduler checks once per minute.
 *
 * It does NOT blindly create picks every minute.
 * publishOfficialPickRelease() checks PickLog first.
 * Once a release exists, it remains locked and immutable.
 */

let officialReleaseSchedulerBusy = false;

async function runOfficialReleaseScheduler() {
  if (officialReleaseSchedulerBusy) {
    return;
  }

  officialReleaseSchedulerBusy = true;

  try {
    const clock = getEasternClock();

    const releases = [
      getOfficialPickRelease("morning"),
      getOfficialPickRelease("afternoon"),
      getOfficialPickRelease("evening"),
    ].filter(Boolean);

    for (const release of releases) {
      const releaseMinutes =
        Number(release.releaseHour) * 60;

      /*
       * Only attempt releases whose scheduled ET time
       * has already arrived.
       *
       * The publisher itself performs the database lock
       * check, so server restarts remain safe.
       */
      if (clock.totalMinutes < releaseMinutes) {
        continue;
      }

      const result = await publishOfficialPickRelease(
        release.releaseSet,
        3
      );

      if (
        result?.success &&
        result?.alreadyPublished === false
      ) {
        console.log(
          `✅ KBETZ AUTO RELEASE: ${release.releaseLabel} — ` +
          `${result.saved} qualified pick(s) locked.`
        );
      }
    }
  } catch (err) {
    console.error(
      "❌ KBETZ Official Picks scheduler error:",
      err.message
    );
  } finally {
    officialReleaseSchedulerBusy = false;
  }
}


/*
 * Run shortly after startup so a Render restart does not
 * cause KBETZ to miss a release that should already exist.
 */
setTimeout(() => {
  runOfficialReleaseScheduler().catch((err) => {
    console.error(
      "❌ Initial Official Picks scheduler error:",
      err.message
    );
  });
}, 15000);


/*
 * Thereafter check release state once per minute.
 */
setInterval(() => {
  runOfficialReleaseScheduler().catch((err) => {
    console.error(
      "❌ Official Picks scheduler interval error:",
      err.message
    );
  });
}, 60000);



/*
 * TEMPORARY OWNER-PROTECTED OFFICIAL PICKS RESET
 * Removes only pending picks for one exact release date + release set.
 */
app.post(
  "/api/picks/reset-official-release",
  requireOwnerSecret,
  async (req, res) => {
    try {
      const releaseDate = String(req.body?.releaseDate || "").trim();
      const releaseSet = String(req.body?.releaseSet || "")
        .trim()
        .toLowerCase();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
        return res.status(400).json({
          success: false,
          error: "Valid releaseDate required: YYYY-MM-DD",
        });
      }

      if (!["morning", "afternoon", "evening"].includes(releaseSet)) {
        return res.status(400).json({
          success: false,
          error: "releaseSet must be morning, afternoon, or evening",
        });
      }

      const query = {
        releaseDate,
        releaseSet,
        result: "pending",
      };

      const matches = await PickLog.find(query).lean();

      if (!matches.length) {
        return res.json({
          success: true,
          deletedCount: 0,
          releaseDate,
          releaseSet,
          message: "No pending picks matched this release.",
        });
      }

      const result = await PickLog.deleteMany(query);

      return res.json({
        success: true,
        releaseDate,
        releaseSet,
        deletedCount: result.deletedCount,
        deletedPicks: matches.map((pick) => ({
          pickKey: pick.pickKey,
          away: pick.away,
          home: pick.home,
          commenceTime: pick.commenceTime,
        })),
      });
    } catch (err) {
      console.error("Official release reset error:", err.message);

      return res.status(500).json({
        success: false,
        error: "Could not reset Official Picks release",
      });
    }
  }
);

app.get("/api/picks/public", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number(req.query.limit || 50), 1),
      100
    );

    /*
     * Keep complete Morning / Afternoon / Evening release history,
     * but calculate KBETZ performance from unique actual selections.
     *
     * The same game + recommendation may legitimately appear in more
     * than one locked release. That history stays visible, but it must
     * not multiply the overall W-L-P record or profit.
     */
    /*
     * Load the complete record for lifetime performance calculations.
     * Only the release-history response is limited for payload size.
     */
    const allPicks = await PickLog.find({})
      .sort({ createdAt: -1 })
      .lean();

    const picks = allPicks.slice(0, limit);

    const uniquePerformanceMap = new Map();

    for (const pick of allPicks) {
      const gameIdentity = String(
        pick.gameId ||
        `${pick.away || ""}|${pick.home || ""}|${pick.commenceTime || ""}`
      )
        .trim()
        .toLowerCase();

      const recommendation = String(
        pick.recommended || pick.bestLine || ""
      )
        .trim()
        .toLowerCase();

      const performanceKey =
        `${gameIdentity}|${recommendation}`;

      /*
       * Picks are newest-first. Keep the newest stored copy as the
       * representative record for this actual selection.
       */
      if (!uniquePerformanceMap.has(performanceKey)) {
        uniquePerformanceMap.set(performanceKey, pick);
      }
    }

    const performancePicks =
      Array.from(uniquePerformanceMap.values());

    const performance = performancePicks.reduce(
      (summary, pick) => {
        const result = String(
          pick.result || pick.status || "pending"
        ).toLowerCase();

        if (result === "win") summary.wins += 1;
        else if (result === "loss") summary.losses += 1;
        else if (result === "push") summary.pushes += 1;
        else summary.pending += 1;

        if (
          result === "win" ||
          result === "loss" ||
          result === "push"
        ) {
          summary.profit += Number(pick.profit || 0);
        }

        return summary;
      },
      {
        wins: 0,
        losses: 0,
        pushes: 0,
        pending: 0,
        profit: 0,
      }
    );

    performance.profit =
      Number(performance.profit.toFixed(2));

    performance.graded =
      performance.wins +
      performance.losses +
      performance.pushes;

    performance.totalUniquePicks =
      performancePicks.length;

    res.json({
      success: true,

      /*
       * Backward-compatible release-history fields.
       */
      count: picks.length,
      picks,

      /*
       * Deduplicated public performance record.
       */
      performance,
      performancePicks,
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


/* ================= MLB AUTO GRADING ================= */

const MLB_TEAM_CANONICAL = {
  "arizona diamondbacks": "ARI",
  "atlanta braves": "ATL",
  "baltimore orioles": "BAL",
  "boston red sox": "BOS",
  "chicago cubs": "CHC",
  "chicago white sox": "CWS",
  "cincinnati reds": "CIN",
  "cleveland guardians": "CLE",
  "colorado rockies": "COL",
  "detroit tigers": "DET",
  "houston astros": "HOU",
  "kansas city royals": "KC",
  "los angeles angels": "LAA",
  "la angels": "LAA",
  "los angeles dodgers": "LAD",
  "miami marlins": "MIA",
  "milwaukee brewers": "MIL",
  "minnesota twins": "MIN",
  "new york mets": "NYM",
  "new york yankees": "NYY",
  "oakland athletics": "ATH",
  "athletics": "ATH",
  "sacramento athletics": "ATH",
  "philadelphia phillies": "PHI",
  "pittsburgh pirates": "PIT",
  "san diego padres": "SD",
  "san francisco giants": "SF",
  "seattle mariners": "SEA",
  "st louis cardinals": "STL",
  "st. louis cardinals": "STL",
  "tampa bay rays": "TB",
  "texas rangers": "TEX",
  "toronto blue jays": "TOR",
  "washington nationals": "WSH"
};

function normalizeMlbTeamName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function mlbTeamKey(value) {
  const normalized = normalizeMlbTeamName(value);

  if (!normalized) return "";

  if (MLB_TEAM_CANONICAL[normalized]) {
    return MLB_TEAM_CANONICAL[normalized];
  }

  /*
   * Safe fallback for provider naming differences.
   * Only used if a known full MLB team name was not matched.
   */
  const aliases = [
    ["diamondbacks", "ARI"],
    ["braves", "ATL"],
    ["orioles", "BAL"],
    ["red sox", "BOS"],
    ["cubs", "CHC"],
    ["white sox", "CWS"],
    ["reds", "CIN"],
    ["guardians", "CLE"],
    ["rockies", "COL"],
    ["tigers", "DET"],
    ["astros", "HOU"],
    ["royals", "KC"],
    ["angels", "LAA"],
    ["dodgers", "LAD"],
    ["marlins", "MIA"],
    ["brewers", "MIL"],
    ["twins", "MIN"],
    ["mets", "NYM"],
    ["yankees", "NYY"],
    ["athletics", "ATH"],
    ["phillies", "PHI"],
    ["pirates", "PIT"],
    ["padres", "SD"],
    ["giants", "SF"],
    ["mariners", "SEA"],
    ["cardinals", "STL"],
    ["rays", "TB"],
    ["rangers", "TEX"],
    ["blue jays", "TOR"],
    ["nationals", "WSH"]
  ];

  for (const [alias, key] of aliases) {
    if (
      normalized === alias ||
      normalized.endsWith(` ${alias}`)
    ) {
      return key;
    }
  }

  return normalized.toUpperCase();
}

function mlbGameMatchKey(away, home) {
  const awayKey = mlbTeamKey(away);
  const homeKey = mlbTeamKey(home);

  if (!awayKey || !homeKey) return "";

  return `${awayKey}@${homeKey}`;
}

function mlbSelectedTeamKey(pick) {
  const recommended = normalizeMlbTeamName(
    pick?.recommended || pick?.bestLine || ""
  );

  const home = normalizeMlbTeamName(pick?.home);
  const away = normalizeMlbTeamName(pick?.away);

  if (home && recommended.includes(home)) {
    return mlbTeamKey(pick.home);
  }

  if (away && recommended.includes(away)) {
    return mlbTeamKey(pick.away);
  }

  /*
   * Fall back to canonical team aliases if the recommendation
   * uses a shortened provider name.
   */
  const homeKey = mlbTeamKey(pick?.home);
  const awayKey = mlbTeamKey(pick?.away);

  for (const teamName of [pick?.home, pick?.away]) {
    const key = mlbTeamKey(teamName);
    const normalizedTeam = normalizeMlbTeamName(teamName);

    const words = normalizedTeam.split(" ");
    const mascot =
      words.length >= 2
        ? words.slice(-2).join(" ")
        : normalizedTeam;

    if (
      normalizedTeam &&
      recommended.includes(normalizedTeam)
    ) {
      return key;
    }

    if (mascot && recommended.includes(mascot)) {
      return key;
    }
  }

  if (recommended.includes(homeKey.toLowerCase())) {
    return homeKey;
  }

  if (recommended.includes(awayKey.toLowerCase())) {
    return awayKey;
  }

  return "";
}

function apiSportsBaseballIsFinal(game) {
  const status = String(
    game?.status?.short ||
    game?.status?.long ||
    game?.status ||
    ""
  )
    .trim()
    .toLowerCase();

  return [
    "ft",
    "final",
    "finished",
    "completed",
    "game finished",
    "ended"
  ].includes(status);
}

function apiSportsBaseballScores(game) {
  const awayRaw =
    game?.scores?.away?.total ??
    game?.scores?.away ??
    game?.score?.away ??
    null;

  const homeRaw =
    game?.scores?.home?.total ??
    game?.scores?.home ??
    game?.score?.home ??
    null;

  const awayScore = Number(awayRaw);
  const homeScore = Number(homeRaw);

  if (
    awayRaw === null ||
    awayRaw === undefined ||
    homeRaw === null ||
    homeRaw === undefined ||
    !Number.isFinite(awayScore) ||
    !Number.isFinite(homeScore)
  ) {
    return null;
  }

  return {
    awayScore,
    homeScore
  };
}

function easternDateFromValue(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return getEasternReleaseDate();
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

app.post("/api/picks/auto-grade-mlb", async (req, res) => {
  try {
    if (!requireGradeSecret(req, res)) return;

    const pendingPicks = await PickLog.find({
      result: "pending",
      $or: [
        { sport: /^MLB$/i },
        { league: /^MLB$/i },
        { sport: /^BASEBALL$/i },
        { league: /baseball/i }
      ]
    });

    const graded = [];
    const skipped = [];

    if (!pendingPicks.length) {
      return res.json({
        success: true,
        source: "therundown",
        sport: "MLB",
        checked: 0,
        gradedCount: 0,
        skippedCount: 0,
        graded: [],
        skipped: [],
        message: "No pending MLB picks"
      });
    }

    /*
     * Pull only dates actually needed by pending KBETZ picks.
     */
    const dates = Array.from(
      new Set(
        pendingPicks.map((pick) =>
          easternDateFromValue(
            pick.commenceTime ||
            pick.createdAt ||
            pick.releaseDate
          )
        )
      )
    ).filter(Boolean);

    const scoresByMatchAndDate = new Map();
    const datesChecked = [];
    const failedDates = new Map();

    for (let dateIndex = 0; dateIndex < dates.length; dateIndex += 1) {
      const date = dates[dateIndex];

      try {
        if (!THERUNDOWN_API_KEY) {
          throw new Error("THERUNDOWN_API_KEY is not configured");
        }

        // TheRundown free tier allows only one request per second.
        // Space date requests apart so a multi-date grading run does
        // not cause the next date to receive HTTP 429.
        if (dateIndex > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1500)
          );
        }

        const url =
          `https://therundown.io/api/v2/sports/3/events/${date}` +
          `?market_ids=1&affiliate_ids=19,22,23&main_line=true&offset=300`;

        const response = await fetch(url, {
          headers: {
            "X-TheRundown-Key": THERUNDOWN_API_KEY,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(
            `TheRundown MLB score request failed with ${response.status}: ${body.slice(0, 300)}`
          );
        }

        const data = await response.json();

        const scoreList = Array.isArray(data?.events)
          ? data.events
          : [];

        datesChecked.push({
          date,
          count: scoreList.length,
          success: true
        });

        for (const game of scoreList) {
          const teams =
            Array.isArray(game?.teams) ? game.teams : [];

          const awayObj = teams.find(
            (team) => team?.is_away === true
          );

          const homeObj = teams.find(
            (team) => team?.is_home === true
          );

          const awayName =
            `${awayObj?.name || ""} ${awayObj?.mascot || ""}`.trim();

          const homeName =
            `${homeObj?.name || ""} ${homeObj?.mascot || ""}`.trim();

          const matchKey = mlbGameMatchKey(
            awayName,
            homeName
          );

          if (!matchKey) continue;

          scoresByMatchAndDate.set(
            `${date}:${matchKey}`,
            game
          );
        }
      } catch (dateErr) {
        failedDates.set(
          date,
          dateErr.message || "TheRundown date request failed"
        );

        datesChecked.push({
          date,
          count: 0,
          success: false,
          error: dateErr.message
        });
      }
    }

    for (const pick of pendingPicks) {
      // Grade against the actual scheduled game date,
      // not the date KBETZ published the pick.
      const date =
        easternDateFromValue(
          pick.commenceTime ||
          pick.createdAt ||
          pick.releaseDate
        );

      const matchKey = mlbGameMatchKey(
        pick.away,
        pick.home
      );

      const game = scoresByMatchAndDate.get(
        `${date}:${matchKey}`
      );

      if (failedDates.has(date)) {
        skipped.push({
          pickKey: pick.pickKey,
          release: pick.releaseLabel,
          game: `${pick.away} @ ${pick.home}`,
          reason: "TheRundown date fetch failed",
          providerError: failedDates.get(date)
        });
        continue;
      }

      if (!game) {
        skipped.push({
          pickKey: pick.pickKey,
          release: pick.releaseLabel,
          game: `${pick.away} @ ${pick.home}`,
          reason: "No matching TheRundown MLB game"
        });
        continue;
      }

      if (game?.score?.event_status !== "STATUS_FINAL") {
        skipped.push({
          pickKey: pick.pickKey,
          release: pick.releaseLabel,
          game: `${pick.away} @ ${pick.home}`,
          reason: "Game is not final",
          status:
            game?.score?.event_status ||
            game?.score?.event_status_detail ||
            "unknown"
        });
        continue;
      }

      const awayScore = Number(game?.score?.score_away);
      const homeScore = Number(game?.score?.score_home);

      const scores =
        Number.isFinite(awayScore) &&
        Number.isFinite(homeScore)
          ? { awayScore, homeScore }
          : null;

      if (!scores) {
        skipped.push({
          pickKey: pick.pickKey,
          release: pick.releaseLabel,
          game: `${pick.away} @ ${pick.home}`,
          reason: "Final score missing"
        });
        continue;
      }

      const gameTeams =
        Array.isArray(game?.teams) ? game.teams : [];

      const awayGameTeam = gameTeams.find(
        (team) => team?.is_away === true
      );

      const homeGameTeam = gameTeams.find(
        (team) => team?.is_home === true
      );

      const awayTeam =
        `${awayGameTeam?.name || ""} ${awayGameTeam?.mascot || ""}`.trim() ||
        pick.away;

      const homeTeam =
        `${homeGameTeam?.name || ""} ${homeGameTeam?.mascot || ""}`.trim() ||
        pick.home;

      const awayKey = mlbTeamKey(awayTeam);
      const homeKey = mlbTeamKey(homeTeam);
      const selectedTeam = mlbSelectedTeamKey(pick);

      if (!selectedTeam) {
        skipped.push({
          pickKey: pick.pickKey,
          release: pick.releaseLabel,
          game: `${pick.away} @ ${pick.home}`,
          recommended: pick.recommended,
          reason: "Could not identify selected MLB team"
        });
        continue;
      }

      let result = "push";

      if (scores.awayScore !== scores.homeScore) {
        const winner =
          scores.awayScore > scores.homeScore
            ? awayKey
            : homeKey;

        result =
          selectedTeam === winner
            ? "win"
            : "loss";
      }

      const profit = calculatePickProfit(
        pick,
        result
      );

      pick.result = result;
      pick.status = result;
      pick.finalScore =
        `${awayTeam} ${scores.awayScore} - ` +
        `${homeTeam} ${scores.homeScore}`;
      pick.notes =
        `Auto-graded from TheRundown MLB ${date}`;
      pick.profit = profit;

      await pick.save();

      graded.push({
        pickKey: pick.pickKey,
        release: pick.releaseLabel,
        game: `${pick.away} @ ${pick.home}`,
        recommended: pick.recommended,
        result,
        profit,
        finalScore: pick.finalScore
      });
    }

    return res.json({
      success: true,
      source: "therundown",
      sport: "MLB",
      datesChecked,
      checked: pendingPicks.length,
      matchedGames: scoresByMatchAndDate.size,
      gradedCount: graded.length,
      skippedCount: skipped.length,
      graded,
      skipped
    });
  } catch (err) {
    console.error(
      "❌ /api/picks/auto-grade-mlb error:",
      err.message
    );

    return res.status(500).json({
      success: false,
      error:
        err.message ||
        "Could not auto-grade MLB picks"
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
    try {
      const payload = await getCachedOdds();
      socket.emit("oddsUpdate", payload.games || []);
    } catch (err) {
      socket.emit("oddsError", { message: "Live odds temporarily unavailable" });
    }
  };

  send();

  // Send cached market updates once per minute.
  // Provider refreshes remain controlled by ODDS_CACHE_MS.
  const interval = setInterval(send, 60000);

  socket.on("disconnect", () => clearInterval(interval));
});

/* ================= BETS ================= */
app.post("/api/bet", requireAuth, async (req, res) => {
  try {
    const { game, odds, stake } = req.body;
    const email = normalizeEmail(req.auth.sub);

    if (!game || !Number.isFinite(Number(odds)) || !Number.isFinite(Number(stake)) || Number(stake) <= 0) {
      return res.status(400).json({ success: false, error: "Valid game, odds, and positive stake are required" });
    }

    await Bet.create({
      email,
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

app.get("/api/bets", requireAuth, async (req, res) => {
  try {
    const email = normalizeEmail(req.auth.sub);
    const bets = await Bet.find({ email }).sort({ createdAt: -1 }).limit(100);
    res.json(bets);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* ================= ROI ================= */
app.get("/api/roi", requireAuth, async (req, res) => {
  try {
    const email = normalizeEmail(req.auth.sub);
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

/* ================= STRIPE WEBHOOK ================= */

/*
 * Keep KBETZ PRO access synchronized with Stripe.
 *
 * PRO access is allowed only while Stripe reports the subscription
 * as trialing or active.
 *
 * trialUsed remains true after a trial begins so the same KBETZ
 * account cannot repeatedly start new free trials.
 */
async function syncStripeSubscriptionAccess(subscription) {
  const email = normalizeEmail(subscription?.metadata?.email);

  if (!email) {
    console.warn(
      "⚠️ Stripe subscription event missing KBETZ email metadata:",
      subscription?.id || "unknown"
    );

    return {
      updated: false,
      reason: "missing_email",
    };
  }

  const status = String(subscription?.status || "").toLowerCase();

  const hasProAccess =
    status === "trialing" ||
    status === "active";

  const update = {
    isPro: hasProAccess,
  };

  /*
   * Once Stripe has actually created a trial/active subscription,
   * remember that this account has consumed its free trial.
   */
  if (status === "trialing" || status === "active") {
    update.trialUsed = true;
  }

  const user = await User.findOneAndUpdate(
    { email },
    { $set: update },
    { new: true }
  );

  if (!user) {
    console.warn(
      "⚠️ Stripe subscription belongs to unknown KBETZ account:",
      email
    );

    return {
      updated: false,
      reason: "user_not_found",
      email,
      status,
    };
  }

  console.log(
    `✅ Stripe subscription sync: ${email} | status=${status} | PRO=${hasProAccess}`
  );

  return {
    updated: true,
    email,
    status,
    isPro: hasProAccess,
  };
}


app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(503).send("Stripe webhook is not configured");
    }

    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(
        "Stripe webhook signature error:",
        err?.message || err
      );

      return res.status(400).send("Invalid Stripe webhook signature");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const email = normalizeEmail(
          session.customer_email ||
            session.customer_details?.email ||
            session.metadata?.email ||
            session.client_reference_id
        );

        if (email && session.mode === "subscription") {
          /*
           * Checkout completion means the customer successfully
           * established the subscription checkout. PRO is enabled
           * for the trial immediately. Future subscription events
           * remain authoritative for continued access.
           */
          await User.findOneAndUpdate(
            { email },
            {
              $set: {
                isPro: true,
                trialUsed: true,
              },
            }
          );

          console.log(
            "✅ Stripe checkout activated KBETZ trial/PRO:",
            email
          );
        }
      }

      if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted"
      ) {
        await syncStripeSubscriptionAccess(event.data.object);
      }

      /*
       * A failed invoice is useful operational information.
       * Stripe subscription status remains authoritative for access.
       * We do not guess at access from the invoice alone.
       */
      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object;

        console.warn(
          "⚠️ Stripe invoice payment failed:",
          invoice?.id || "unknown"
        );
      }

      if (event.type === "invoice.paid") {
        const invoice = event.data.object;

        console.log(
          "✅ Stripe invoice paid:",
          invoice?.id || "unknown"
        );
      }

      return res.json({ received: true });
    } catch (err) {
      console.error(
        "Stripe webhook processing error:",
        err?.message || err
      );

      return res.status(500).json({
        received: false,
        error: "Stripe webhook processing failed",
      });
    }
  }
);

/* ================= STRIPE ================= */
app.post("/api/checkout", requireAuth, async (req, res) => {
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

      const email = normalizeEmail(req.auth?.sub);

    if (!email) {
      return res.status(401).json({
        success: false,
          error: "Authentication required for checkout",
      });
    }

      const checkoutUser = await User.findOne({ email }).lean();

      if (!checkoutUser) {
        return res.status(404).json({
          success: false,
          error: "KBETZ account not found",
        });
      }

      if (checkoutUser.trialUsed === true) {
        return res.status(409).json({
          success: false,
          error: "This KBETZ account has already used its 7-day free trial.",
        });
      }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      client_reference_id: email,
      metadata: { email },
      subscription_data: {
        metadata: { email },
        trial_period_days: 7,
      },
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${CLIENT_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
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


/* ================= STRIPE BILLING PORTAL ================= */
app.post("/api/billing-portal", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        error: "Stripe is not configured",
      });
    }

    const email = normalizeEmail(req.auth?.sub);

    if (!email) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const customers = await stripe.customers.list({
      email,
      limit: 10,
    });

    if (!customers.data.length) {
      return res.status(404).json({
        success: false,
        error: "No Stripe billing account was found for this KBETZ account.",
      });
    }

    const customer =
      customers.data.find((item) => item.email === email) ||
      customers.data[0];

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${CLIENT_URL}/dashboard`,
      });

    return res.json({
      success: true,
      url: portalSession.url,
    });
  } catch (err) {
    console.error(
      "Stripe billing portal error:",
      err?.message || err
    );

    return res.status(500).json({
      success: false,
      error: err?.message || "Could not open billing portal",
    });
  }
});

/* ================= STRIPE PRO CONFIRM ================= */
app.post("/api/pro/confirm", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        error: "Stripe is not configured",
      });
    }

    const sessionId = String(req.body.sessionId || req.body.session_id || "").trim();

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Stripe session ID is required",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const email = normalizeEmail(
      session.customer_email ||
        session.customer_details?.email ||
        session.metadata?.email ||
        session.client_reference_id
    );

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete" ||
      session.subscription?.status === "active" ||
      session.subscription?.status === "trialing";

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "No email found on Stripe session",
      });
    }

    if (email !== normalizeEmail(req.auth.sub)) {
      return res.status(403).json({
        success: false,
        error: "Stripe session does not belong to this account",
      });
    }

    if (!paid) {
      return res.status(402).json({
        success: false,
        error: "Stripe session is not paid or active yet",
        status: session.status,
        payment_status: session.payment_status,
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isPro: true, trialUsed: true },
      { new: true }
    );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "KBETZ account not found",
        });
      }

    res.json({
      success: true,
      email: user.email,
      isPro: true,
      plan: "pro",
    });
  } catch (err) {
    console.error("❌ /api/pro/confirm error:", err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.message || "Could not confirm PRO payment",
    });
  }
});

/* ================= WEBHOOK / PRO HELPERS ================= */
app.post("/api/pro/activate", requireOwnerSecret, async (req, res) => {
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
if (process.env.NODE_ENV === "production") {
  const missing = [];
  if (!process.env.MONGO_URI) missing.push("MONGO_URI");
  if (!SESSION_SECRET) missing.push("SESSION_SECRET");
  if (!OWNER_SECRET) missing.push("OWNER_SECRET");
  if (!OWNER_EMAIL) missing.push("OWNER_EMAIL");
  if (!STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
  if (missing.length) {
    console.error(`❌ Missing required production environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

server.listen(PORT, () => {
  console.log(`🔥 KBETZ LIVE on ${PORT}`);
});
