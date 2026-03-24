import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

console.log("🚀 KBETZ server starting...");

/* =========================
   ROOT TEST
========================= */
app.get("/", (req, res) => {
  res.send("KBETZ LIVE ✅");
});

/* =========================
   ODDS ROUTE (CRITICAL)
========================= */
app.get("/odds", (req, res) => {
  console.log("📊 /odds route hit");

  res.json([
    {
      id: "1",
      home_team: "Lakers",
      away_team: "Warriors",
      sport_key: "basketball_nba",
      commence_time: new Date().toISOString(),
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Lakers", price: -120 },
            { name: "Warriors", price: 105 },
          ],
        },
      ],
    },
    {
      id: "2",
      home_team: "Celtics",
      away_team: "Bucks",
      sport_key: "basketball_nba",
      commence_time: new Date().toISOString(),
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Celtics", price: -140 },
            { name: "Bucks", price: 120 },
          ],
        },
      ],
    },
  ]);
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});// force redeploy
