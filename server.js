import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import oddsRoutes from "./routes/oddsRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";

dotenv.config();

const app = express();

// 🔥 MIDDLEWARE
app.use(cors());
app.use(express.json());

// 🔥 ROUTES
app.use("/api/odds", oddsRoutes);
app.use("/api/stripe", stripeRoutes);

// 🔥 HEALTH CHECK (Render test)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// 🔥 ROOT CHECK
app.get("/", (req, res) => {
  res.send("KBETZ BACKEND LIVE");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 SERVER RUNNING ON PORT ${PORT}`);
});