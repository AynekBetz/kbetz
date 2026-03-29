import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🔐 AUTH
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // 💳 SUBSCRIPTION
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    stripeCustomerId: String,
    stripeSubscriptionId: String,

    // 👑 ROLE (ADMIN SYSTEM)
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // 📊 STATS
    totalBets: {
      type: Number,
      default: 0,
    },

    wins: {
      type: Number,
      default: 0,
    },

    losses: {
      type: Number,
      default: 0,
    },

    profit: {
      type: Number,
      default: 0,
    },

    // 🔥 FUTURE (for streaks / achievements)
    currentStreak: {
      type: Number,
      default: 0,
    },

    bestStreak: {
      type: Number,
      default: 0,
    },

    // 🕒 CREATED DATE
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // auto adds createdAt + updatedAt
  }
);

export default mongoose.model("User", userSchema);