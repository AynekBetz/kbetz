import express from "express";

const router = express.Router();

// TEMP MOCK DATA (so your app works immediately)
router.get("/", async (req, res) => {
  try {
    const games = [
      {
        id: "1",
        home: "Lakers",
        away: "Warriors",
        odds: -110,
        ev: 5.2,
        sharp: true,
        arb: false,
        lineMove: 3,
      },
      {
        id: "2",
        home: "Celtics",
        away: "Heat",
        odds: +120,
        ev: 4.1,
        sharp: false,
        arb: true,
        lineMove: 2,
      },
      {
        id: "3",
        home: "Bucks",
        away: "Knicks",
        odds: -150,
        ev: 3.5,
        sharp: true,
        arb: false,
        lineMove: 1,
      },
    ];

    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;