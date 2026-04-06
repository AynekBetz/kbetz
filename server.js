import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import stripeRoutes from "./routes/stripeRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 IMPORTANT: ROUTE MOUNT
app.use("/api/stripe", stripeRoutes);

// ✅ HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// ROOT
app.get("/", (req, res) => {
  res.send("KBETZ BACKEND LIVE");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 SERVER RUNNING ON PORT ${PORT}`);
});