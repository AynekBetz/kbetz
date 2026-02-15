import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fetch from "node-fetch";
import "./config/db.js"; // MongoDB connection

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ==============================
   HEALTH CHECK
============================== */
app.get("/api/test", (req, res) => {
  res.json({ status: "Server running" });
});

/* ==============================
   GET AVAILABLE SPORTS
============================== */
app.get("/api/sports", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${process.env.ODDS_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json(data);
    }

    // Only return active sports
    const activeSports = data.filter((sport) => sport.active === true);

    res.json(activeSports);
  } catch (error) {
    console.error("Sports fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

/* ==============================
   GET ODDS BY SPORT
============================== */
app.get("/api/odds", async (req, res) => {
  try {
    const { sport } = req.query;

    if (!sport) {
      return res.status(400).json({ error: "Sport key required" });
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${process.env.ODDS_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json(data);
    }

    if (!data.length) {
      return res.json({ message: "No live games right now" });
    }

    res.json(data);
  } catch (error) {
    console.error("Odds fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch odds" });
  }
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
