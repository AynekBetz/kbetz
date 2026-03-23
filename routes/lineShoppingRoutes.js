import express from "express"
import { getCachedEvents, getCachedBets } from "../utils/liveScanner.js"

const router = express.Router()

router.get("/", (req, res) => {

  const events = getCachedEvents()
  const bets = getCachedBets()

  const lines = events.map((event) => {

    const eventBets = bets.filter((b) => b.game === event)

    const bestOdds = Math.max(...eventBets.map((b) => b.odds))

    return {
      event,
      bestOdds
    }

  })

  res.json(lines)

})

export default router