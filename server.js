import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;

// 🔥 UNIQUE SIGNATURE (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("KBETZ VERSION 2 — NEW SERVER ✅");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "VERSION 2 ACTIVE"
  });
});

app.listen(PORT, () => {
  console.log("🔥 RUNNING VERSION 2 SERVER");
});