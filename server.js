import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io"
import rateLimit from "express-rate-limit"

import evRoutes from "./routes/evRoutes.js"
import arbRoutes from "./routes/arbRoutes.js"
import sharpRoutes from "./routes/sharpRoutes.js"
import steamRoutes from "./routes/steamRoutes.js"
import lineRoutes from "./routes/lineRoutes.js"
import lineShoppingRoutes from "./routes/lineShoppingRoutes.js"
import feedRoutes from "./routes/feedRoutes.js"
import stripeRoutes from "./routes/stripeRoutes.js"
import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import betRoutes from "./routes/betRoutes.js"
import betsRoutes from "./routes/betsRoutes.js"
import statsRoutes from "./routes/statsRoutes.js"

import { runLiveScanner } from "./utils/liveScanner.js"

dotenv.config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

/*
-----------------------------------
Middleware
-----------------------------------
*/

app.use(cors())

app.use(express.json())

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200
})

app.use(limiter)

/*
-----------------------------------
Health Check (Render needs this)
-----------------------------------
*/

app.get("/health", (req, res) => {
  res.json({ status: "KBETZ backend running" })
})

/*
-----------------------------------
Routes
-----------------------------------
*/

app.use("/api/ev", evRoutes)
app.use("/api/arbitrage", arbRoutes)
app.use("/api/sharp", sharpRoutes)
app.use("/api/steam", steamRoutes)
app.use("/api/lines", lineRoutes)
app.use("/api/line-shopping", lineShoppingRoutes)
app.use("/api/feed", feedRoutes)
app.use("/api/stripe", stripeRoutes)
app.use("/api/webhook", stripeWebhookRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/bet", betRoutes)
app.use("/api/bets", betsRoutes)
app.use("/api/stats", statsRoutes)

/*
-----------------------------------
Socket.io Live Feed
-----------------------------------
*/

io.on("connection", (socket) => {
  console.log("Client connected")

  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

/*
-----------------------------------
Start Scanner
-----------------------------------
*/

async function startScanner() {
  console.log("Starting live scanner...")

  try {
    await runLiveScanner()

    setInterval(async () => {
      await runLiveScanner()
    }, 15000)

  } catch (err) {
    console.log("Scanner error:", err)
  }
}

startScanner()

/*
-----------------------------------
Server
-----------------------------------
*/

const PORT = process.env.PORT || 10000

server.listen(PORT, () => {
  console.log(`KBETZ server running on port ${PORT}`)
})