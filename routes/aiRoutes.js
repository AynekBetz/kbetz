import express from "express";

// ✅ IMPORTANT: correct relative path to utils
import {
  generateTopPlays,
  generateParlay,
} from "../utils/aiEngine.js";

const router = express.Router();

// =========================
// 🔥 AI TOP PLAYS
// =========================
router.post("/top-plays", (req, res) => {
  try {
    const { games } = req.body;

    // Validate input
    if (!games || !Array.isArray(games)) {
      return res.status(400).json({
        error: "Invalid input: games must be an array",
      });
    }

    const plays = generateTopPlays(games);

    res.json({
      success: true,
      count: plays.length,
      plays,
    });
  } catch (err) {
    console.error("❌ AI Top Plays Error:", err);
    res.status(500).json({
      error: "Failed to generate top plays",
    });
  }
});

// =========================
// 💰 AI PARLAY BUILDER
// =========================
router.post("/parlay", (req, res) => {
  try {
    const { games } = req.body;

    // Validate input
    if (!games || !Array.isArray(games)) {
      return res.status(400).json({
        error: "Invalid input: games must be an array",
      });
    }

    const parlay = generateParlay(games);

    res.json({
      success: true,
      parlay,
    });
  } catch (err) {
    console.error("❌ AI Parlay Error:", err);
    res.status(500).json({
      error: "Failed to generate parlay",
    });
  }
});

// =========================
// 🧪 TEST ROUTE (VERIFY AI WORKS)
// =========================
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "AI Routes working ✅",
  });
});

export default router;