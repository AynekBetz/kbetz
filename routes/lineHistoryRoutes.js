import express from "express";
import LineHistory from "../models/LineHistory.js";

const router = express.Router();

// SAVE LINE SNAPSHOT
router.post("/save", async (req, res) => {
  try {
    const { gameId, odds, book } = req.body;

    await LineHistory.create({
      gameId,
      odds,
      book,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET LINE HISTORY
router.get("/:gameId", async (req, res) => {
  try {
    const data = await LineHistory.find({
      gameId: req.params.gameId,
    }).sort({ timestamp: 1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;