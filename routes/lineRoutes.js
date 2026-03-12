import express from "express";
import { getLineHistory } from "../utils/lineTracker.js";

const router = express.Router();

/*
  GET LINE MOVEMENT HISTORY
  Endpoint: /api/lines
*/

router.get("/", (req, res) => {

  try {

    const history = getLineHistory();

    res.json(history);

  } catch (error) {

    console.error("Line history error:", error);

    res.status(500).json({
      error: "Failed to fetch line movement history"
    });

  }

});

export default router;