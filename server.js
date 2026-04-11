import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 10000;

// =============================
// MOCK DATA (ALWAYS WORKS)
// =============================
const games = [
  {
    id: "1",
    home: "Lakers",
    away: "Warriors",
    odds: -110
  },
  {
    id: "2",
    home: "Celtics",
    away: "Heat",
    odds: -130
  }
];

// =============================
// EV CALC
// =============================
function calculateEV(odds) {
  const prob = 0.5;
  const payout = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
  return (prob * payout - (1 - prob)) * 100;
}

// =============================
// AI PICK
// =============================
function getAIPick() {
  const best = games[0];

  return {
    matchup: `${best.away} @ ${best.home}`,
    odds: best.odds,
    ev: calculateEV(best.odds).toFixed(2),
    confidence: "MEDIUM"
  };
}

// =============================
// ROUTE
// =============================
app.get("/api/data", (req, res) => {
  const enriched = games.map((g) => ({
    ...g,
    ev: calculateEV(g.odds).toFixed(2)
  }));

  res.json({
    games: enriched,
    aiPick: getAIPick()
  });
});

// =============================
app.listen(PORT, () => {
  console.log(`🔥 STABLE SERVER running on ${PORT}`);
});