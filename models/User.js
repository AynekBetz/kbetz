import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: String,
  password: String,

  plan: {
    type: String,
    default: "free",
  },

  stripeCustomerId: String,
});

export default mongoose.model("User", userSchema);