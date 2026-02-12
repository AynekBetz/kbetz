import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

/* ===============================
   HEALTH CHECK
=================================*/
app.get("/api/health", (req, res) => {
  res.json({ status: "Server running ✅" });
});

/* ===============================
   TEST ROUTE
=================================*/
app.get("/api/odds/test", (req, res) => {
  res.json({
    keyExists: !!ODDS_API_KEY,
    message: "If keyExists is true, Render env variable is working."
  });
});

/* ===============================
   GET AVAILABLE SPORTS
=================================*/
app.get("/api/sports", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports?apiKey=${ODDS_API_KEY}`
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Sports fetch error:", error);
    res.status(500).json({ error: "Sports fetch failed" });
  }
});

/* ===============================
   GET ODDS
=================================*/
app.get("/api/odds", async (req, res) => {
  try {
    const sport = req.query.sport || "americanfootball_nfl";
    const regions = "us";
    const markets = "h2h";

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=${regions}&markets=${markets}&apiKey=${ODDS_API_KEY}`
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Odds fetch error:", error);
    res.status(500).json({ error: "Odds fetch failed" });
  }
});

/* ===============================
   FRONTEND FALLBACK
=================================*/
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===============================
   START SERVER
=================================*/
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
