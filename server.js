import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Stripe from "stripe";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

console.log("🚀 KBETZ SERVER STARTING");

/* ================= STRIPE ================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= MIDDLEWARE ================= */
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("✅ MongoDB Connected"))
.catch(err=>console.log(err));

/* ================= MODELS ================= */
const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  email:String,
  isPro:{type:Boolean,default:false}
}));

const OddsHistory = mongoose.models.OddsHistory || mongoose.model("OddsHistory", new mongoose.Schema({
  gameId:String,
  odds:Number,
  timestamp:{type:Date,default:Date.now}
}));

const Bet = mongoose.models.Bet || mongoose.model("Bet", new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  gameId:String,
  pick:String,
  odds:Number,
  stake:Number,
  result:{type:String,default:"pending"},
  profit:{type:Number,default:0},
  createdAt:{type:Date,default:Date.now}
}));

/* ================= PRO CHECK ================= */
app.get("/api/me", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ isPro:false });

    const user = await User.findOne({ email });

    res.json({
      isPro: user?.isPro || false
    });

  } catch {
    res.json({ isPro:false });
  }
});

/* ================= LOGIN (NEW) ================= */
app.post("/api/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, isPro: false });
      console.log("🆕 New user created:", email);
    }

    res.json({
      success: true,
      email: user.email,
      isPro: user.isPro
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= STRIPE WEBHOOK ================= */
app.post("/api/stripe/webhook", async (req, res) => {

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const email = event.data.object.customer_email;

    const user = await User.findOne({ email });
    if (user) {
      user.isPro = true;
      await user.save();
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const customer = await stripe.customers.retrieve(event.data.object.customer);
    const user = await User.findOne({ email: customer.email });
    if (user) {
      user.isPro = false;
      await user.save();
    }
  }

  if (event.type === "invoice.payment_failed") {
    const customer = await stripe.customers.retrieve(event.data.object.customer);
    const user = await User.findOne({ email: customer.email });
    if (user) {
      user.isPro = false;
      await user.save();
    }
  }

  res.sendStatus(200);
});

/* ================= BILLING PORTAL ================= */
app.post("/api/billing-portal", async (req, res) => {
  try {
    const { email } = req.body;

    const customers = await stripe.customers.list({ email });
    if (!customers.data.length) {
      return res.status(400).json({ error: "No customer found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${process.env.CLIENT_URL}/billing`
    });

    res.json({ url: session.url });

  } catch {
    res.status(500).json({ error: "Billing portal failed" });
  }
});

/* ================= CACHE ================= */
const cache = {};
const CACHE_TIME = 30000;

const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

/* ================= DATA ENGINE ================= */
app.get("/api/data", async (req, res) => {
  try {
    const sport = req.query.sport || "basketball_nba";

    if (cache[sport] && Date.now() - cache[sport].time < CACHE_TIME) {
      return res.json(cache[sport].data);
    }

    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`;

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.json({ source:"fallback", games:[] });
    }

    const games = [];

    for (const g of data.slice(0,20)) {
      const books = (g.bookmakers || []).slice(0,2).map(b => {
        const h2h = b.markets?.find(m => m.key === "h2h");
        return {
          name: b.title,
          home: h2h?.outcomes?.find(o => o.name === g.home_team)?.price,
          away: h2h?.outcomes?.find(o => o.name === g.away_team)?.price
        };
      }).filter(b => b.home && b.away);

      if (!books.length) continue;

      const homeOdds = books[0].home;

      games.push({
        id:g.id,
        home:g.home_team,
        away:g.away_team,
        homeOdds,
        books
      });
    }

    const result = { source:"real", games };
    cache[sport] = { data:result, time:Date.now() };

    res.json(result);

  } catch {
    res.json({ source:"fallback", games:[] });
  }
});

/* ================= START ================= */
app.listen(PORT,()=>{
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});