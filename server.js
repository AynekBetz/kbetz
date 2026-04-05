import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

import oddsRoutes from "./routes/oddsRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";

dotenv.config();

const app = express();

// 🔥 CORS FIX (CRITICAL)
app.use(cors({
  origin: [
    "https://kbetz-frontend.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// 🔥 ROUTES
app.use("/api/odds", oddsRoutes);
app.use("/api/stripe", stripeRoutes);

// 🔥 HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// 🔥 ROOT
app.get("/", (req, res) => {
  res.send("KBETZ BACKEND LIVE");
});

// 🔥 KEEP RENDER AWAKE
setInterval(() => {
  fetch("https://kbetz-backend.onrender.com/api/health")
    .then(() => console.log("🔁 keep alive"))
    .catch(() => {});
}, 1000 * 60 * 10);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🔥 SERVER RUNNING ON PORT ${PORT}`);
});