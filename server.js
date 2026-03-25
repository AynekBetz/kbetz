import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ROOT
app.get("/", (req, res) => {
  res.send("KBETZ API LIVE ✅");
});

// HEALTH (used by frontend)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "KBETZ™",
    connected: true
  });
});

// USER (TEMP — will connect to DB later)
app.get("/me", (req, res) => {
  res.json({
    user: {
      id: "demo-user",
      email: "demo@kbetz.com",
      plan: "free"
    }
  });
});

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});