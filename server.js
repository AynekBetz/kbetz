// server.js — Phase A (Node 22 / Render SAFE)

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 5000;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

// ---- UTIL ----
function americanToDecimal(odds) {
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}

function impliedProbability(odds) {
  return odds > 0
    ? 100 / (odds + 100)
    : Math.abs(odds) / (Math.abs(odds) + 100);
}

function expectedValue(prob, odds) {
  const dec = americanToDecimal(odds);
  return prob * (dec - 1) - (1 - prob);
}

// ---- ANALYZE ----
app.post("/api/analyze", (req, res) => {
  try {
    const { odds, userProb, hedgeThreshold = 0.03 } = req.body;

    const ev = expectedValue(userProb, odds);
    const implied = impliedProbability(odds);

    const hedgeAlert = ev < -hedgeThreshold;

    res.json({
      ev: Number(ev.toFixed(4)),
      impliedProb: Number(implied.toFixed(4)),
      hedgeAlert,
      message: hedgeAlert
        ? "⚠️ Hedge recommended — EV dropped"
        : "✅ No hedge needed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// ---- ODDS TEST (USES BUILT-IN FETCH) ----
app.get("/api/odds", async (req, res) => {
  try {
    if (!ODDS_API_KEY) {
      return res.status(500).json({ error: "Missing ODDS_API_KEY" });
    }

    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?regions=us&markets=h2h&oddsFormat=american&apiKey=${ODDS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data.slice(0, 2));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Odds fetch failed" });
  }
});

// ---- START SERVER (THIS OPENS THE PORT) ----
app.listen(PORT, () => {
  console.log(`✅ KBetz™ running on port ${PORT}`);
});
