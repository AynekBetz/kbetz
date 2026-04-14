import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ODDS_API_KEY;

// ✅ FALLBACK (NEVER BREAK FRONTEND)
const fallbackGames = [
  { id: 1, away: "Warriors", home: "Lakers", odds: -110 },
  { id: 2, away: "Heat", home: "Celtics", odds: -130 },
];

// 🔥 LIVE ODDS FETCH
async function fetchOdds() {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h`;

    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) return fallbackGames;

    return data.map((game, i) => {
      const book = game.bookmakers?.[0];
      const market = book?.markets?.[0];
      const outcome = market?.outcomes?.[0];

      return {
        id: i + 1,
        away: game.away_team || "Away",
        home: game.home_team || "Home",
        odds: outcome?.price || -110,
      };
    });
  } catch (err) {
    console.log("ODDS API ERROR:", err);
    return fallbackGames;
  }
}

// 🔒 LOCKED ROUTE
app.get("/api/data", async (req, res) => {
  try {
    const games = await fetchOdds();

    res.json({
      success: true,
      games,
    });
  } catch (err) {
    res.json({
      success: false,
      games: fallbackGames,
    });
  }
});

// HEALTH
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🔥 KBETZ LIVE SERVER ${PORT}`);
});