import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  plan: { type: String, default: "free" },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
});

export default mongoose.model("User", userSchema);