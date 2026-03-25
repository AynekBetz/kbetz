import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ROOT
app.get("/", (req, res) => {
  res.send("KBETZ BACKEND LIVE ✅");
});

// HEALTH
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    route: "/health working"
  });
});

// TEST
app.get("/test", (req, res) => {
  res.send("TEST ROUTE WORKING ✅");
});

// START
app.listen(PORT, () => {
  console.log(`🔥 KBETZ running on port ${PORT}`);
});