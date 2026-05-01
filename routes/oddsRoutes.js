import express from "express";
import fetch from "node-fetch";

const router = express.Router();

let cache = [];
let lastFetch = 0;

router.get("/", async (req, res) => {

try {
// 🧠 CACHE (60 sec)
if (Date.now() - lastFetch < 60000 && cache.length > 0) {
return res.json({ games: cache });
}


const response = await fetch(
  `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`
);

const data = await response.json();

if (!Array.isArray(data)) throw new Error("Bad data");

const games = data.slice(0, 10).map((g, i) => ({
  id: i.toString(),
  home: g.home_team,
  away: g.away_team,
  homeOdds: g.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price || -110,
  confidence: Math.floor(Math.random() * 20 + 55),
  edgeScore: (Math.random() * 10).toFixed(2)
}));

cache = games;
lastFetch = Date.now();

res.json({ games });


} catch (err) {
console.log("ODDS ERROR:", err.message);


res.json({
  games: [],
  error: "fallback"
});


}

});

export default router;
