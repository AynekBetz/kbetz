// server.js — Phase A: Odds + Hedge Alerts
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 5000;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

// --- UTILITIES ---
function americanToDecimal(odds) {
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
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

// --- ODDS FETCH ---
async function fetchOdds() {
  const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?regions=us&markets=h2h&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Odds API failed");
  return res.json();
}

// --- ANALYZE + HEDGE LOGIC ---
app.post("/api/analyze", async (req, res) => {
  try {
    const { odds, userProb, hedgeThreshold = 0.03 } = req.body;

    const ev = expectedValue(userProb, odds);
    const implied = impliedProbability(odds);

    let hedgeAlert = false;
    let message = "No hedge needed";

    if (ev < -hedgeThreshold) {
      hedgeAlert = true;
      message = "⚠️ Hedge recommended — EV dropped below threshold";
    }

    res.json({
      ev: Number(ev.toFixed(4)),
      impliedProb: Number(implied.toFixed(4)),
      hedgeAlert,
      message,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// --- LIVE ODDS TEST ENDPOINT ---
app.get("/api/odds", async (req, res) => {
  try {
    const odds = await fetchOdds();
    res.json(odds.slice(0, 3)); // return sample
  } catch (e) {
    res.status(500).json({ error: "Odds fetch failed" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ KBetz™ running on port ${PORT}`)
);
