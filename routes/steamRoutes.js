import express from "express";
import { getCachedSteam } from "../utils/liveScanner.js";

const router = express.Router();

router.get("/", (req, res) => {

  const steam = getCachedSteam();

  res.json(steam);

});

export default router;