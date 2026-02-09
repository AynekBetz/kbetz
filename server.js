const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_render";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =======================
   DATA FILES
======================= */
const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const slipsFile = path.join(dataDir, "slips.json");
const alertsFile = path.join(dataDir, "alerts.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
for (const f of [usersFile, slipsFile, alertsFile]) {
  if (!fs.existsSync(f)) fs.writeFileSync(f, "[]");
}

const read = (f) => JSON.parse(fs.readFileSync(f));
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

/* =======================
   AUTH MIDDLEWARE
======================= */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* =======================
   AUTH ROUTES
======================= */
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const users = read(usersFile);
  if (users.find((u) => u.email === email))
    return res.status(400).json({ error: "User exists" });

  const hash = await bcrypt.hash(password, 10);
  users.push({ id: Date.now(), email, password: hash, role: "free" });
  write(usersFile, users);
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const users = read(usersFile);
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(400).json({ error: "Invalid login" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token });
});

/* =======================
   SLIPS
======================= */
app.post("/api/slips", auth, (req, res) => {
  const slips = read(slipsFile);
  const slip = {
    id: Date.now(),
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    data: req.body,
  };
  slips.push(slip);
  write(slipsFile, slips);
  res.json({ id: slip.id });
});

app.get("/api/slips", auth, (req, res) => {
  res.json(read(slipsFile).filter((s) => s.userId === req.user.id));
});

/* =======================
   HEDGE ALERT ENGINE
======================= */
function americanToDecimal(o) {
  return o > 0 ? 1 + o / 100 : 1 + 100 / -o;
}

app.post("/api/evaluate-hedge", auth, (req, res) => {
  const { slipId, hedgeOdds } = req.body;
  const slips = read(slipsFile);
  const alerts = read(alertsFile);

  const slip = slips.find(
    (s) => s.id === slipId && s.userId === req.user.id
  );
  if (!slip) return res.status(404).json({ error: "Slip not found" });

  const bankroll = slip.data.bankroll;
  const stake = bankroll * (slip.data.betPercent / 100);
  const lastLeg = slip.data.legs.at(-1);

  const winAmount =
    stake * (americanToDecimal(lastLeg.odds) - 1);

  const hedgeStake = winAmount / americanToDecimal(hedgeOdds);
  const hedgeEV = winAmount - hedgeStake;

  if (hedgeEV > 0) {
    alerts.push({
      id: Date.now(),
      userId: req.user.id,
      slipId,
      message: `🚨 HEDGE NOW — +EV hedge available at ${hedgeOdds}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    write(alertsFile, alerts);
  }

  res.json({ hedgeStake, hedgeEV, alert: hedgeEV > 0 });
});

app.get("/api/alerts", auth, (req, res) => {
  res.json(read(alertsFile).filter((a) => a.userId === req.user.id));
});

/* =======================
   START
======================= */
app.listen(PORT, () =>
  console.log(`✅ KBetz™ running on port ${PORT}`)
);
