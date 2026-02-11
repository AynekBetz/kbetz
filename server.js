// =============================
// KBetz™ Production Server
// =============================

const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();

// =============================
// CONFIG
// =============================
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// =============================
// MIDDLEWARE
// =============================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =============================
// AUTH MIDDLEWARE
// =============================
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// =============================
// HEALTH CHECK
// =============================
app.get("/", (req, res) => {
  res.send("KBetz™ server running");
});

// =============================
// ODDS ROUTE (LIVE)
// =============================
app.get("/api/odds", async (req, res) => {
  try {
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing ODDS_API_KEY" });
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${apiKey}&regions=us&markets=h2h`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);

  } catch (err) {
    console.error("Odds fetch error:", err);
    res.status(500).json({ error: "Odds fetch failed" });
  }
});

// =============================
// SIMPLE TEST ROUTE
// =============================
app.get("/api/odds/test", (req, res) => {
  res.json({ message: "Odds route is working" });
});

// =============================
// LOGIN (Demo JWT)
// =============================
app.post("/api/login", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token });
});

// =============================
// PROTECTED ROUTE EXAMPLE
// =============================
app.get("/api/protected", authenticate, (req, res) => {
  res.json({ message: "Protected route access granted", user: req.user });
});

// =============================
// START SERVER
// =============================
app.listen(PORT, () => {
  console.log(`✅ KBetz™ running on port ${PORT}`);
});
