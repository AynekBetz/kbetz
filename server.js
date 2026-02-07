const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = "KBETZ_SECRET";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- HELPERS ----------
const toDec = o => (o > 0 ? o / 100 + 1 : 100 / Math.abs(o) + 1);

function auth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ---------- FILE PATHS ----------
const usersFile = "users.json";
const slipsFile = "slips.json";

// ---------- ROOT ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- AUTH ----------
app.post("/register", async (req, res) => {
  const users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile)) : [];
  if (users.find(u => u.email === req.body.email)) {
    return res.status(400).json({ error: "User exists" });
  }

  users.push({
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10)
  });

  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ status: "registered" });
});

app.post("/login", async (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersFile));
  const user = users.find(u => u.email === req.body.email);

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ error: "Invalid login" });
  }

  res.json({ token: jwt.sign({ email: user.email }, SECRET) });
});

// ---------- ANALYZE ----------
app.post("/analyze", (req, res) => {
  const slip = req.body.slip || [];
  let prob = 1;
  let dec = 1;

  slip.forEach(l => {
    prob *= l.prob;
    dec *= toDec(l.odds);
  });

  const ev = prob * (dec - 1) * 10 - (1 - prob) * 10;

  res.json({ ev: ev.toFixed(2) });
});

// ---------- SAVE SLIP ----------
app.post("/save", auth, (req, res) => {
  const slips = fs.existsSync(slipsFile) ? JSON.parse(fs.readFileSync(slipsFile)) : [];
  slips.push({ user: req.user.email, analysis: req.body.analysis });
  fs.writeFileSync(slipsFile, JSON.stringify(slips, null, 2));
  res.json({ status: "saved" });
});

// ---------- LEADERBOARD ----------
app.get("/leaderboard", (req, res) => {
  if (!fs.existsSync(slipsFile)) return res.json([]);

  const slips = JSON.parse(fs.readFileSync(slipsFile));
  const scores = {};

  slips.forEach(s => {
    scores[s.user] ??= [];
    scores[s.user].push(Number(s.analysis.ev));
  });

  const board = Object.entries(scores)
    .map(([user, evs]) => ({
      user,
      avgEV: (evs.reduce((a, b) => a + b, 0) / evs.length).toFixed(2)
    }))
    .sort((a, b) => b.avgEV - a.avgEV);

  res.json(board);
});

// ---------- START ----------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Live on ${PORT}`);
});
