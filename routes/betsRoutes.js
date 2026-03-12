import express from "express"

const router = express.Router()

/* MOCK BET HISTORY */

router.get("/", (req,res)=>{

 res.json([
  {
   game:"Celtics vs Knicks",
   bet:"Celtics -4.5",
   result:"win"
  },
  {
   game:"Lakers vs Warriors",
   bet:"Lakers ML",
   result:"loss"
  },
  {
   game:"Bucks vs Heat",
   bet:"Bucks -3",
   result:"win"
  }
 ])

})

export default router