import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 10000;
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

/* ===============================
   MONGODB CONNECTION
================================= */

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err.message));
}

/* ===============================
   HEALTH CHECK
================================= */

app.get("/", (req, res) => {
  res.json({ status: "Server running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Healthy" });
});

/* ===============================
   SPORTS ENDPOINT
================================= */

app.get("/api/sports", async (req, res) => {
  try {
    if (!ODDS_API_KEY) {
      return res.status(500).json({ error: "ODDS_API_KEY not set" });
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Sports Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

/* ===============================
   START SERVER
================================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
