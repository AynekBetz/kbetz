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

/* ================= STRIPE WEBHOOK (UPGRADED) ================= */
app.post("/api/stripe/webhook", async (req, res) => {

const sig = req.headers["stripe-signature"];
let event;

try {
event = stripe.webhooks.constructEvent(
req.body,
sig,
process.env.STRIPE_WEBHOOK_SECRET
);
} catch (err) {
console.log("❌ Webhook signature failed");
return res.sendStatus(400);
}

/* ================= UPGRADE ================= */
if (event.type === "checkout.session.completed") {

const session = event.data.object;
const email = session.customer_email;

try {
const user = await User.findOne({ email });

if (user) {
user.isPro = true;
await user.save();
console.log("✅ PRO unlocked:", email);
}

} catch (err) {
console.log("user update failed", err);
}
}

/* ================= CANCEL ================= */
if (event.type === "customer.subscription.deleted") {

const subscription = event.data.object;
const customerId = subscription.customer;

try {
const customer = await stripe.customers.retrieve(customerId);

const user = await User.findOne({ email: customer.email });

if (user) {
user.isPro = false;
await user.save();
console.log("❌ PRO removed (cancel):", customer.email);
}

} catch (err) {
console.log("cancel error", err);
}
}

/* ================= PAYMENT FAILED ================= */
if (event.type === "invoice.payment_failed") {

const invoice = event.data.object;

try {
const customer = await stripe.customers.retrieve(invoice.customer);

const user = await User.findOne({ email: customer.email });

if (user) {
user.isPro = false;
await user.save();
console.log("❌ PRO removed (payment failed):", customer.email);
}

} catch (err) {
console.log("payment fail error", err);
}
}

res.sendStatus(200);
});

/* ================= 🆕 BILLING PORTAL (NEW) ================= */
app.post("/api/billing-portal", async (req, res) => {
try {
const { email } = req.body;

if (!email) {
return res.status(400).json({ error: "Email required" });
}

const customers = await stripe.customers.list({ email });

if (!customers.data.length) {
return res.status(400).json({ error: "No customer found" });
}

const customerId = customers.data[0].id;

const session = await stripe.billingPortal.sessions.create({
customer: customerId,
return_url: `${process.env.CLIENT_URL}/billing`
});

res.json({ url: session.url });

} catch (err) {
console.log("billing portal error", err);
res.status(500).json({ error: "Billing portal failed" });
}
});

/* ================= CACHE ================= */
const cache = {};
const CACHE_TIME = 30000;

/* ================= UTILS ================= */
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

/* (UNCHANGED — your full logic stays here) */

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

const avgHome = books.reduce((sum, b) => sum + b.home, 0) / books.length;

const impliedBest = 1 / toDecimal(bestHome);
const impliedAvg = 1 / toDecimal(avgHome);
const ev = ((impliedAvg - impliedBest) * 100);

let arb = false;
if (books.length >= 2) {
const d1 = toDecimal(books[0].home);
const d2 = toDecimal(books[1].away);
if ((1/d1)+(1/d2)<1) arb = true;
}

let confidence = 50;

if (ev > 1) confidence += 5;
if (ev > 2) confidence += 10;
if (ev > 4) confidence += 15;
if (ev > 7) confidence += 10;

if (steamStrength === "medium") confidence += 10;
if (steamStrength === "strong") confidence += 20;

if (Math.abs(move) >= 3) confidence += 5;
if (Math.abs(move) >= 5) confidence += 10;

confidence = Math.min(confidence, 95);

let recommendation = "NO BET";

if (arb) recommendation = "ARB OPPORTUNITY";
else if (ev > 5 && confidence > 75)
recommendation = `🔥 STRONG ${g.home_team} ML`;
else if (ev > 2 && confidence > 65)
recommendation = `${g.home_team} ML`;

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
ev:Number(ev.toFixed(2)),
arb,
confidence,
recommendation,
books
});
}

const result = { source:"real", games };

cache[sport] = { data:result, time:Date.now() };

res.json(result);

} catch(err){
res.json({ source:"fallback", games:[] });
}
});

/* ================= AUTO GRADER ================= */
const gradeBets = async () => {
try {
const pending = await Bet.find({ result:"pending" });
if (!pending.length) return;

const res = await fetch(
`https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?apiKey=${process.env.ODDS_API_KEY}&daysFrom=1`
);

const scores = await res.json();

for (const bet of pending) {

const game = scores.find(g => g.id === bet.gameId);
if (!game || !game.completed) continue;

const homeScore = game.scores.find(s=>s.name===game.home_team)?.score;
const awayScore = game.scores.find(s=>s.name===game.away_team)?.score;

if (homeScore == null || awayScore == null) continue;

let result = "loss";

if (bet.pick === game.home_team && homeScore > awayScore) result = "win";
if (bet.pick === game.away_team && awayScore > homeScore) result = "win";

const profit = result === "win"
? bet.stake * (toDecimal(bet.odds)-1)
: -bet.stake;

await Bet.findByIdAndUpdate(bet._id,{
result,
profit:Number(profit.toFixed(2))
});
}

} catch(err){
console.log("grading error", err);
}
};

setInterval(gradeBets, 60000);

app.get("/api/grade", async (req,res)=>{
await gradeBets();
res.json({status:"graded"});
});

/* ================= START ================= */
app.listen(PORT,()=>{
console.log(`🔥 KBETZ API running on port ${PORT}`);
});
