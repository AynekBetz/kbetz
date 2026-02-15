import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

/* ------------------------------
   HEALTH CHECK
-------------------------------- */
app.get("/api/test", (req, res) => {
  res.json({ status: "Server running" });
});

/* ------------------------------
   GET SPORTS
-------------------------------- */
app.get("/api/sports", async (req, res) => {
  try {
    if (!process.env.ODDS_API_KEY) {
      return res.status(500).json({ error: "Missing ODDS_API_KEY" });
    }

    const url = `https://api.the-odds-api.com/v4/sports/?apiKey=${process.env.ODDS_API_KEY}`;

    console.log("Fetching sports from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("API error:", text);
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();

    res.json(data);

  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

/* ------------------------------
   GET ODDS BY SPORT
-------------------------------- */
app.get("/api/odds", async (req, res) => {
  try {
    const { sport } = req.query;

    if (!sport) {
      return res.status(400).json({ error: "Sport is required" });
    }

    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`;

    console.log("Fetching odds from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("API error:", text);
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();

    res.json(data);

  } catch (err) {
    console.error("Odds fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch odds" });
  }
});

/* ------------------------------
   START SERVER
-------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
