import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  password: String,

  // 🔥 PRO ACCESS
  pro: {
    type: Boolean,
    default: false
  },

  // 💳 STRIPE LINK
  stripeCustomerId: {
    type: String,
    default: null
  }
});

export default mongoose.model("User", userSchema);