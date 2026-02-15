import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  pro: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
