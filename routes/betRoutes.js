import express from "express"
import { addBet, getBets, settleBet } from "../models/betStore.js"

const router = express.Router()

router.get("/", (req, res) => {

  res.json(getBets())

})

router.post("/add", (req, res) => {

  addBet(req.body)

  res.json({ status: "bet added" })

})

router.post("/settle", (req, res) => {

  const { id, result } = req.body

  settleBet(id, result)

  res.json({ status: "bet updated" })

})

export default router