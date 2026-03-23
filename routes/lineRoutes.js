import express from "express";
import { getCachedEvents } from "../utils/liveScanner.js";

const router = express.Router();

router.get("/", (req, res) => {
  const data = getCachedEvents();
  res.json(data);
});

export default router;