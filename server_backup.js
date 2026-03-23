import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 10000;

/* =========================
   MONGO CONNECTION
   ========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error:", err.message));

/* =========================
   MODELS
   ========================= */

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const BetSchema = new mongoose.Schema({
  userId: String,
  team: String,
  odds: Number,
  result: String,
  date: Number,
});

const User = mongoose.model("User", UserSchema);
const Bet = mongoose.model("Bet", BetSchema);

/* =========================
   AUTH MIDDLEWARE
   ========================= */

const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json("No token");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json("Invalid token");
  }
};

/* =========================
   AUTH ROUTES
   ========================= */

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed,
  });

  res.json(user);
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json("User not found");

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.status(400).json("Wrong password");

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

/* =========================
   BET ROUTES (CLOUD)
   ========================= */

// SAVE BET
app.post("/bets", auth, async (req, res) => {
  const bet = await Bet.create({
    userId: req.user.id,
    ...req.body,
  });

  res.json(bet);
});

// GET BETS
app.get("/bets", auth, async (req, res) => {
  const bets = await Bet.find({ userId: req.user.id });
  res.json(bets);
});

/* =========================
   ODDS (KEEP YOUR DATA)
   ========================= */

app.get("/odds", (req, res) => {
  res.json([
    {
      id: "1",
      home_team: "Lakers",
      away_team: "Warriors",
      markets: [
        {
          outcomes: [
            { name: "Lakers", price: -120 },
            { name: "Warriors", price: 105 },
          ],
        },
      ],
    },
    {
      id: "2",
      home_team: "Celtics",
      away_team: "Bucks",
      markets: [
        {
          outcomes: [
            { name: "Celtics", price: -140 },
            { name: "Bucks", price: 120 },
          ],
        },
      ],
    },
  ]);
});

/* =========================
   START SERVER
   ========================= */

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});