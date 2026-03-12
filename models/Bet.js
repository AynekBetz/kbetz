import mongoose from "mongoose";

const betSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  sport: String,
  matchup: String,
  odds: Number,
  stake: Number,
  probability: Number,
  result: {
    type: String,
    enum: ["win", "loss", "pending"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Bet", betSchema);