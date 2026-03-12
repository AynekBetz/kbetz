import express from "express"

import { getCachedBets } from "../utils/liveScanner.js"

import { authMiddleware } from "../middleware/authMiddleware.js"
import { requirePlan } from "../middleware/planGate.js"

const router = express.Router()


/*
   GET /api/ev

   Requires:
   - logged in user
   - PRO plan or higher
*/

router.get("/",
  authMiddleware,
  requirePlan("PRO"),
  (req,res)=>{

    const bets = getCachedBets()

    res.json(bets)

  }
)


export default router