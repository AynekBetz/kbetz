import express from "express"
import { getCachedEvents } from "../utils/liveScanner.js"
import { findBestLines } from "../utils/lineShopping.js"

const router = express.Router()

router.get("/", (req,res)=>{

 const events = getCachedEvents()

 const lines = findBestLines(events)

 res.json(lines)

})

export default router