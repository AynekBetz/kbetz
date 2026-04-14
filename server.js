import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🔥 REAL ODDS API ROUTE
app.get("/api/data", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`
    );

    const data = await response.json();

    const games = data.map((game, index) => {
      const book = game.bookmakers?.[0];
      const market = book?.markets?.[0];
      const outcomes = market?.outcomes || [];

      return {
        id: index,
        away: game.away_team,
        home: game.home_team,
        odds: outcomes[0]?.price || -110, // first team price
      };
    });

    res.json({
      success: true,
      games,
    });

  } catch (err) {
    console.log("ODDS API ERROR:", err.message);

    // fallback
    res.json({
      success: false,
      games: [
        { id: 1, away: "Warriors", home: "Lakers", odds: -110 },
        { id: 2, away: "Heat", home: "Celtics", odds: -130 },
      ],
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 SERVER RUNNING ON PORT ${PORT}`);
});