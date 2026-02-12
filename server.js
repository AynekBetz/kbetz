import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==============================
// HEALTH CHECK
// ==============================
app.get("/api/test", (req, res) => {
  res.json({ status: "Server running" });
});

// ==============================
// FETCH IN-SEASON SPORTS
// ==============================
app.get("/api/sports", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${process.env.ODDS_API_KEY}`
    );

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Failed to fetch sports" });
    }

    const activeSports = data.filter(s => s.active === true);

    res.json(activeSports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sports fetch failed" });
  }
});

// ==============================
// FETCH ODDS
// ==============================
app.get("/api/odds", async (req, res) => {
  const sport = req.query.sport;

  if (!sport) {
    return res.status(400).json({ error: "Sport is required" });
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=us&markets=h2h&apiKey=${process.env.ODDS_API_KEY}`
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Odds fetch failed" });
  }
});

// ==============================
// FALLBACK ROUTE
// ==============================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
