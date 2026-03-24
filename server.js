import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

console.log("🚀 KBETZ CLEAN SERVER RUNNING");

/* ROOT */
app.get("/", (req, res) => {
  res.send("KBETZ LIVE ✅");
});

/* ODDS */
app.get("/odds", (req, res) => {
  console.log("ODDS HIT");

  res.json([
    {
      id: "1",
      home_team: "Lakers",
      away_team: "Warriors",
      markets: [
        {
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
      markets: [
        {
          outcomes: [
            { name: "Celtics", price: -140 },
            { name: "Bucks", price: 120 },
          ],
        },
      ],
    },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});