import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const API_KEY = process.env.ODDS_API_KEY;

// NBA example — you can add more sports later
router.get("/", async (req, res) => {
  try {
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;

    const response = await fetch(url);
    const data = await response.json();

    const games = data.map((game) => {
      const book = game.bookmakers?.[0];
      const outcomes = book?.markets?.[0]?.outcomes || [];

      return {
        id: game.id,
        home: game.home_team,
        away: game.away_team,
        odds: outcomes[0]?.price || -110,

        books: game.bookmakers.slice(0,2).map(b => ({
          name: b.title,
          odds: b.markets?.[0]?.outcomes?.[0]?.price
        }))
      };
    });

    res.json({ games });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Odds fetch failed" });
  }
});

export default router;