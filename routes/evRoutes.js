import express from "express"
import { getCachedBets } from "../utils/liveScanner.js"

const router = express.Router()

router.get("/", (req, res) => {

  const bets = getCachedBets()

  const evBets = bets.filter((bet) => bet.odds > -110)

  res.json(evBets)

})

export default router