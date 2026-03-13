import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("KBETZ API Running");
});

app.get("/scanner", (req, res) => {
  res.json({
    games: [
      {
        game: "Bucks vs Celtics",
        sharpSide: "Bucks",
        edge: "+5.2%",
      },
      {
        game: "Lakers vs Suns",
        sharpSide: "Suns",
        edge: "+3.8%",
      },
    ],
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});