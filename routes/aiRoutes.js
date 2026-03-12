import express from "express"

import { generateDailyBet } from "../utils/aiBetCard.js"
import { getCachedBets } from "../utils/liveScanner.js"

const router = express.Router()

router.get("/", (req,res)=>{

 const bets = getCachedBets()

 const aiBet = generateDailyBet(bets)

 res.json(aiBet)

})

export default router