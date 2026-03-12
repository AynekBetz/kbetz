import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    {
      game: "Heat vs Bulls",
      book1: "DraftKings +110",
      book2: "FanDuel +105",
      profit: "2.3%"
    }
  ]);
});

export default router;