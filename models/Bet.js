import mongoose from "mongoose";

const betSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    picks: [
      {
        type: {
          type: String,
          enum: ["moneyline", "spread", "total", "prop"],
          required: true,
        },

        team: String,
        odds: Number,

        // SPREAD
        spread: Number,

        // TOTAL
        total: Number,
        direction: String,

        // 🔥 PLAYER PROPS
        player: String,        // "LeBron James"
        stat: String,          // "points", "rebounds", "assists"
        line: Number,          // 25.5
        propDirection: String, // "over" or "under"
      },
    ],

    stake: Number,
    potentialPayout: Number,

    status: {
      type: String,
      enum: ["pending", "won", "lost"],
      default: "pending",
    },

    resultProfit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bet", betSchema);