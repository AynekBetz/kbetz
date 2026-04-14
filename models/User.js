import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    default: "free", // free or pro
  },
}, {
  timestamps: true, // adds createdAt / updatedAt (useful later)
});

export default mongoose.model("User", userSchema);