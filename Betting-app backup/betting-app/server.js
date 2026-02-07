// KBetz™ Full Backend Server

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    app: "KBetz™",
    message: "Server running",
    time: new Date().toISOString()
  });
});

// analyze slip
app.post("/analyze", (req, res) => {
  const { slip } = req.body;

  if (!slip || !Array.isArray(slip)) {
    return res.status(400).json({ error: "Invalid slip data" });
  }

  const legs = slip.length;
  let confidenceScore = Math.max(100 - legs * 12, 20);

  let riskLevel = "Low";
  if (confidenceScore < 70) riskLevel = "Medium";
  if (confidenceScore < 50) riskLevel = "High";

  const warnings = [];
  if (legs > 3) warnings.push("High-leg parlay: one miss kills the ticket");
  if (riskLevel === "High") warnings.push("Very volatile outcome");

  res.json({
    confidenceScore,
    riskLevel,
    warnings,
    slip
  });
});

// save slips
app.post("/save", (req, res) => {
  const filePath = path.join(__dirname, "slips.json");
  const existing = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath))
    : [];

  existing.push(req.body);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

  res.json({ message: "Slip saved" });
});

// get saved slips
app.get("/slips", (req, res) => {
  const filePath = path.join(__dirname, "slips.json");
  if (!fs.existsSync(filePath)) return res.json([]);
  res.json(JSON.parse(fs.readFileSync(filePath)));
});

// start server
app.listen(PORT, () => {
  console.log(`✅ KBetz™ running on http://localhost:${PORT}`);
});
