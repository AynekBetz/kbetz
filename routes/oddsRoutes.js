import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const API_KEY = process.env.ODDS_API_KEY;

router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching odds...");

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american`
    );

    const data = await response.json();

    // 🔥 DEBUG LOG
    console.log("API RESPONSE:", data);

    // ❌ HANDLE BAD RESPONSE
    if (!Array.isArray(data)) {
      console.log("⚠️ API did not return array");

      return res.json([
        {
          id: 1,
          team: "Demo Game",
          home: "Lakers",
          away: "Warriors",
          bestHome: { odds: -120, book: "DemoBook" },
          bestAway: { odds: +110, book: "DemoBook" }
        }
      ]);
    }

    const formatted = data.map((game, i) => {
      const home = game.home_team;
      const away = game.away_team;

      const bookmakers = game.bookmakers || [];

      let bestHome = { odds: -Infinity, book: "" };
      let bestAway = { odds: -Infinity, book: "" };

      bookmakers.forEach(book => {
        const outcomes = book.markets?.[0]?.outcomes;
        if (!outcomes) return;

        outcomes.forEach(o => {
          if (o.name === home && o.price > bestHome.odds) {
            bestHome = { odds: o.price, book: book.title };
          }

          if (o.name === away && o.price > bestAway.odds) {
            bestAway = { odds: o.price, book: book.title };
          }
        });
      });

      return {
        id: i,
        team: `${away} vs ${home}`,
        home,
        away,
        bestHome,
        bestAway
      };
    });

    res.json(formatted);

  } catch (err) {
    console.log("❌ Odds error:", err.message);

    // 🔥 SAFE FALLBACK
    res.json([
      {
        id: 1,
        team: "Fallback Game",
        home: "Heat",
        away: "Celtics",
        bestHome: { odds: -115, book: "Fallback" },
        bestAway: { odds: +105, book: "Fallback" }
      }
    ]);
  }
});

export default router;