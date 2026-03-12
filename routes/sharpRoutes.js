import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    {
      game: "Lakers vs Warriors",
      sharpSide: "Lakers",
      movement: "-2 → -4.5",
      confidence: "High"
    }
  ]);
});

export default router;