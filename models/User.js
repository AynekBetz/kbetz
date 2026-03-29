import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  plan: { type: String, default: "free" },

  // 📊 STATS
  totalBets: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
});

export default mongoose.model("User", userSchema);