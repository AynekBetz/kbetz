import mongoose from "mongoose";

const betSchema = new mongoose.Schema({
  userId: String,
  stake: Number,
  odds: Number,
  result: String, // "win" | "loss"
  profit: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Bet", betSchema);