import mongoose from "mongoose";

const LineHistorySchema = new mongoose.Schema({
  gameId: String,
  odds: Number,
  book: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("LineHistory", LineHistorySchema);