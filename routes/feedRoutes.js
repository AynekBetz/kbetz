import express from "express"
import { getMarketFeed } from "../utils/marketFeed.js"

const router = express.Router()

router.get("/", (req, res) => {

  const feed = getMarketFeed()

  res.json(feed)

})

export default router