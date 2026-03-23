import express from "express";
import { buildParlays } from "../utils/parlayBuilder.js";

const router = express.Router();

let latestData = [];

export const setParlayData = (data) => {
  latestData = data;
};

router.get("/", (req, res) => {
  console.log("PARLAY DATA:", latestData);

  const parlays = buildParlays(latestData);

  console.log("PARLAYS:", parlays);

  res.json(parlays);
});

export default router;