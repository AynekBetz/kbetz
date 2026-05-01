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

/* ================= CACHE ================= */
const cache = {};
const CACHE_TIME = 30000;

/* ================= UTILS ================= */
const toDecimal = (o)=> o>0 ? (o/100)+1 : (100/Math.abs(o))+1;

/* ================= AI ================= */
const calculateAI = (ev, move, steamStrength) => {
let confidence = 50;

if (ev > 3) confidence += 10;
if (ev > 5) confidence += 10;

if (steamStrength === "strong") confidence += 15;
if (Math.abs(move) >= 5) confidence += 10;

return Math.min(confidence, 95);
};

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
  console.log("⚠️ API QUOTA HIT — USING FALLBACK");

  return res.json({
    source: "fallback",
    games: []
  });
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

  const last = await OddsHistory.findOne({gameId:g.id}).sort({timestamp:-1});

  let move = 0;
  let steam=false;
  let steamStrength="none";

  if(last){
    move = homeOdds - last.odds;

    if(Math.abs(move)>=3){
      steam=true;
      steamStrength="medium";
    }

    if(Math.abs(move)>=5){
      steam=true;
      steamStrength="strong";
    }
  }

  let bestHome = homeOdds;
  books.forEach(b=>{
    if(b.home > bestHome) bestHome = b.home;
  });

  const ev = ((toDecimal(bestHome) / toDecimal(homeOdds)) - 1) * 100;

  let arb = false;
  if (books.length >= 2) {
    const d1 = toDecimal(books[0].home);
    const d2 = toDecimal(books[1].away);
    if ((1/d1)+(1/d2)<1) arb = true;
  }

  const confidence = calculateAI(ev, move, steamStrength);

  let recommendation = "NO BET";
  if (arb) recommendation = "ARB";
  else if (confidence > 75) recommendation = `${g.home_team} ML`;

  await OddsHistory.create({
    gameId:g.id,
    odds:homeOdds
  });

  games.push({
    id:g.id,
    home:g.home_team,
    away:g.away_team,
    homeOdds,
    move,
    steam,
    steamStrength,
    ev,
    arb,
    confidence,
    recommendation,
    books
  });
}

const result = { source:"real", games };

cache[sport] = {
  data: result,
  time: Date.now()
};

res.json(result);


} catch(err){
console.log(err);
res.json({ source:"fallback", games:[] });
}
});

/* ================= ODDS ROUTE (NEW) ================= */
app.get('/api/odds', async (req, res) => {
try {
const response = await fetch(
`https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h`
);


const data = await response.json();

if (!Array.isArray(data)) {
  return res.json({ source: "fallback", games: [] });
}

const games = data.slice(0, 10).map((g, i) => ({
  id: g.id || i,
  home: g.home_team,
  away: g.away_team,
  homeOdds:
    g.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === g.home_team)?.price || -110,
  books: g.bookmakers?.map(b => ({
    name: b.title,
    home: b.markets?.[0]?.outcomes?.find(o => o.name === g.home_team)?.price
  })) || []
}));

res.json({ source: "real", games });


} catch (err) {
console.error("Odds error:", err);
res.status(500).json({ error: "Failed to fetch odds" });
}
});

/* ================= HISTORY ================= */
app.get("/api/history/:gameId", async (req, res) => {
const history = await OddsHistory.find({ gameId:req.params.gameId })
.sort({ timestamp:1 })
.limit(50);

res.json(history);
});

/* ================= STEAM ================= */
app.get("/api/steam", async (req, res) => {
const recent = await OddsHistory.find()
.sort({ timestamp:-1 })
.limit(50);

const alerts = [];

for (let i=1;i<recent.length;i++){
const curr = recent[i];
const prev = recent[i-1];


const move = curr.odds - prev.odds;

if(Math.abs(move)>=5){
  alerts.push({
    gameId:curr.gameId,
    move,
    strength:"STRONG"
  });
}


}

res.json(alerts);
});

/* ================= STRIPE ================= */
app.post("/api/checkout", async (req, res) => {
const { email } = req.body;

const session = await stripe.checkout.sessions.create({
payment_method_types:["card"],
mode:"subscription",
customer_email:email,
line_items:[{price:process.env.STRIPE_PRICE_ID,quantity:1}],
success_url:`${process.env.CLIENT_URL}/dashboard`,
cancel_url:`${process.env.CLIENT_URL}/dashboard`
});

res.json({url:session.url});
});

/* ================= START ================= */
app.listen(PORT,()=>{
console.log(`🔥 KBETZ API running on port ${PORT}`);
});
