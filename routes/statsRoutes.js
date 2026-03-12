import express from "express"
import { getBets } from "../models/betStore.js"
import { calculateBankrollStats } from "../utils/bankroll.js"

const router = express.Router()

router.get("/", (req, res) => {

  const bets = getBets()

  const stats = calculateBankrollStats(bets)

  res.json(stats)

})

export default router