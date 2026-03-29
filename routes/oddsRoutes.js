import express from "express";

const router = express.Router();

router.get("/odds", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.log("❌ Odds fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch odds" });
  }
});

export default router;