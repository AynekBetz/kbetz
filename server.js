import express from "express"
import cors from "cors"

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Root route (health check)
app.get("/", (req, res) => {
  res.json({
    status: "KBETZ API running",
    version: "1.0"
  })
})

/*
-------------------------------------
SCANNER ROUTE
-------------------------------------
This powers the KBETZ scanner page
GET https://kbetz-1.onrender.com/scanner
*/
app.get("/scanner", (req, res) => {

  const games = [
    {
      game: "Milwaukee Bucks vs Boston Celtics",
      sharpSide: "Bucks",
      edge: "+5.2%",
      confidence: "High",
      market: "Spread"
    },
    {
      game: "Los Angeles Lakers vs Phoenix Suns",
      sharpSide: "Suns",
      edge: "+3.8%",
      confidence: "Medium",
      market: "Moneyline"
    },
    {
      game: "Golden State Warriors vs Denver Nuggets",
      sharpSide: "Over 232.5",
      edge: "+4.1%",
      confidence: "Medium",
      market: "Total"
    }
  ]

  res.json({
    success: true,
    count: games.length,
    games
  })
})

/*
-------------------------------------
BET SLIP ANALYZER (future feature)
-------------------------------------
*/
app.post("/analyze-slip", (req, res) => {

  const { legs } = req.body

  res.json({
    fragileLeg: legs ? legs[0] : null,
    message: "Bet analysis engine coming soon"
  })

})

/*
-------------------------------------
SERVER START
-------------------------------------
*/
const PORT = process.env.PORT || 10000

app.listen(PORT, () => {
  console.log(`KBETZ API running on port ${PORT}`)
})